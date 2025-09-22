"""FHIR data ingestion router."""

import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator
import logging
from datetime import datetime
import uuid

from ..adapters.fhir_client import (
    SourceFHIRClient,
    HapiFHIRClient,
    FHIRClientError,
    FHIRServerError,
    FHIRValidationError
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["ingest"])


class IngestRequest(BaseModel):
    """Request model for data ingestion."""
    sourceBaseUrl: str = Field(..., description="Base URL of the source FHIR server")
    patientId: str = Field(..., description="ID of the patient to ingest")
    resources: List[str] = Field(
        default=["Patient", "Encounter", "Condition", "Observation"],
        description="List of resource types to ingest"
    )

    @validator("sourceBaseUrl")
    def validate_url(cls, v):
        if not v or not v.startswith(("http://", "https://")):
            raise ValueError("sourceBaseUrl must be a valid HTTP(S) URL")
        return v

    @validator("patientId")
    def validate_patient_id(cls, v):
        if not v or not v.strip():
            raise ValueError("patientId cannot be empty")
        return v.strip()

    @validator("resources")
    def validate_resources(cls, v):
        if not v:
            raise ValueError("At least one resource type must be specified")
        valid_types = [
            "Patient", "Encounter", "Condition", "Observation",
            "MedicationRequest", "AllergyIntolerance", "Procedure",
            "DiagnosticReport", "Immunization", "CarePlan"
        ]
        for resource_type in v:
            if resource_type not in valid_types:
                raise ValueError(f"Invalid resource type: {resource_type}. Valid types: {', '.join(valid_types)}")
        return v


class IngestResponse(BaseModel):
    """Response model for data ingestion."""
    success: bool
    message: str
    patientReference: Optional[str] = None
    resourceCounts: Dict[str, int] = {}
    bundleId: Optional[str] = None
    errors: List[str] = []


def create_bundle_entry(resource: Dict[str, Any], method: str = "POST") -> Dict[str, Any]:
    """Create a bundle entry for a resource."""
    resource_type = resource.get("resourceType")
    resource_id = resource.get("id", str(uuid.uuid4()))

    if method == "POST":
        url = resource_type
    else:
        url = f"{resource_type}/{resource_id}"

    entry = {
        "resource": resource,
        "request": {
            "method": method,
            "url": url
        }
    }

    if method == "PUT":
        entry["request"]["ifMatch"] = "*"

    return entry


def ensure_patient_first(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure Patient resource is first in the bundle entries."""
    patient_entries = []
    other_entries = []

    for entry in entries:
        resource = entry.get("resource", {})
        if resource.get("resourceType") == "Patient":
            patient_entries.append(entry)
        else:
            other_entries.append(entry)

    return patient_entries + other_entries


@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
async def ingest_patient_data(request: IngestRequest):
    """
    Ingest patient data from a source FHIR server to HAPI.

    Process:
    1. Validate inputs
    2. Pull Patient and requested resources from source
    3. Write to HAPI via transaction Bundle
    4. Return counts and patient reference
    """
    errors = []
    resource_counts = {}

    try:
        source_client = SourceFHIRClient(request.sourceBaseUrl)
        hapi_client = HapiFHIRClient()

        logger.info(f"Starting ingestion for patient {request.patientId} from {request.sourceBaseUrl}")

        try:
            all_resources = await source_client.get_patient_resources(
                request.patientId,
                request.resources
            )
        except FHIRServerError as e:
            if e.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Patient {request.patientId} not found at source server"
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Source server error: {str(e)}"
            )
        except FHIRClientError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to retrieve data from source: {str(e)}"
            )

        if not all_resources.get("Patient"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient {request.patientId} not found"
            )

        bundle_entries = []
        patient_ref = None

        for resource_type, resources in all_resources.items():
            resource_counts[resource_type] = len(resources)

            for resource in resources:
                if resource_type == "Patient":
                    patient_ref = f"Patient/{resource.get('id', request.patientId)}"

                    if "id" not in resource:
                        resource["id"] = request.patientId

                try:
                    entry = create_bundle_entry(resource, method="PUT")
                    bundle_entries.append(entry)
                except Exception as e:
                    error_msg = f"Failed to create bundle entry for {resource_type}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)

        bundle_entries = ensure_patient_first(bundle_entries)

        transaction_bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": bundle_entries
        }

        logger.info(f"Sending transaction bundle with {len(bundle_entries)} entries")

        try:
            response_bundle = await hapi_client.transaction(transaction_bundle)
            bundle_id = response_bundle.get("id")

            logger.info(f"Successfully ingested data. Bundle ID: {bundle_id}")

            return IngestResponse(
                success=True,
                message=f"Successfully ingested {sum(resource_counts.values())} resources",
                patientReference=patient_ref,
                resourceCounts=resource_counts,
                bundleId=bundle_id,
                errors=errors
            )

        except FHIRServerError as e:
            logger.error(f"HAPI server error: {str(e)}")
            if e.status_code and 400 <= e.status_code < 500:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"HAPI validation error: {str(e)}"
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"HAPI server error: {str(e)}"
            )
        except FHIRValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid FHIR data: {str(e)}"
            )
        except FHIRClientError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to write to HAPI: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during ingestion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error during ingestion: {str(e)}"
        )