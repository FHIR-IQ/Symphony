"""Router for materializing summary contracts to FHIR resources."""

import base64
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator
import logging

from ..adapters.fhir_client import HapiFHIRClient, FHIRClientError
from ..schemas.summary_contract import SummaryContract, SummaryValidationError
from ..services.materialize import create_summary_bundle

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["materialize"])


class MaterializeRequest(BaseModel):
    """Request model for materializing summary to FHIR resources."""
    summaryJSON: Dict[str, Any] = Field(..., description="Summary contract JSON")
    method: str = Field("composition", description="Materialization method")
    authorDisplay: Optional[str] = Field("Symphony AI", description="Author display name")
    docRefTags: Optional[List[str]] = Field(None, description="Tags for DocumentReference")
    pdfBase64: Optional[str] = Field(None, description="Base64 encoded PDF content")
    sourceBundleRef: Optional[str] = Field(None, description="Reference to source bundle")

    @validator("method")
    def validate_method(cls, v):
        valid_methods = ["composition", "lists", "document", "all"]
        if v not in valid_methods:
            raise ValueError(f"method must be one of: {', '.join(valid_methods)}")
        return v

    @validator("pdfBase64")
    def validate_pdf_base64(cls, v):
        if v is not None:
            try:
                base64.b64decode(v)
            except Exception:
                raise ValueError("pdfBase64 must be valid base64 encoded data")
        return v


class MaterializeResponse(BaseModel):
    """Response model for materialization."""
    success: bool
    message: str
    bundleId: str
    compositionId: Optional[str] = None
    listIds: List[str] = []
    documentReferenceId: Optional[str] = None
    provenanceId: Optional[str] = None
    errors: List[str] = []


@router.post("/materialize", response_model=MaterializeResponse, status_code=status.HTTP_201_CREATED)
async def materialize_summary(request: MaterializeRequest):
    """
    Materialize a SummaryContract to FHIR resources.

    Process:
    1. Validate summaryJSON against SummaryContract
    2. Create the chosen output resources
    3. Write to HAPI via transaction
    4. Return created resource IDs
    """
    errors = []

    try:
        # Validate summary JSON
        try:
            summary_contract = SummaryContract(**request.summaryJSON)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid summary contract: {str(e)}"
            )

        # Extract patient ID from summary contract
        patient_id = None

        # Try to extract patient ID from provenance references
        for problem in summary_contract.problems:
            if problem.provenance and problem.provenance.startswith("Condition/"):
                # For now, assume patient ID can be extracted from context
                # In a real implementation, you'd look up the Condition to get the patient
                break

        # If no patient ID found, try other sources
        if not patient_id:
            for med in summary_contract.medications:
                if med.provenance and med.provenance.startswith("MedicationRequest/"):
                    break

        # For this implementation, we'll require patient ID to be provided separately
        # or inferred from the first available provenance
        if not patient_id:
            # Extract from first available provenance or use a default
            all_provenances = []
            for items in [summary_contract.problems, summary_contract.medications,
                         summary_contract.allergies, summary_contract.vitals,
                         summary_contract.labs, summary_contract.procedures,
                         summary_contract.encounters]:
                for item in items:
                    if hasattr(item, 'provenance') and item.provenance:
                        all_provenances.append(item.provenance)

            if all_provenances:
                # For this demo, we'll use a heuristic to extract patient ID
                # In production, you'd query HAPI to get the patient reference
                patient_id = "extracted-patient"  # Placeholder
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot determine patient ID from summary contract"
                )

        logger.info(f"Materializing summary for patient {patient_id} using method: {request.method}")

        # Decode PDF bytes if provided
        pdf_bytes = None
        if request.pdfBase64:
            try:
                pdf_bytes = base64.b64decode(request.pdfBase64)
            except Exception as e:
                errors.append(f"Failed to decode PDF: {str(e)}")

        # Create transaction bundle
        try:
            bundle = create_summary_bundle(
                contract=summary_contract,
                patient_id=patient_id,
                method=request.method,
                author_display=request.authorDisplay or "Symphony AI",
                pdf_bytes=pdf_bytes,
                doc_ref_tags=request.docRefTags,
                source_bundle_ref=request.sourceBundleRef
            )
        except Exception as e:
            logger.error(f"Failed to create summary bundle: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create FHIR resources: {str(e)}"
            )

        # Write to HAPI
        hapi_client = HapiFHIRClient()

        try:
            response_bundle = await hapi_client.transaction(bundle)
            bundle_id = response_bundle.get("id", bundle["id"])

            logger.info(f"Successfully materialized summary. Bundle ID: {bundle_id}")

        except FHIRClientError as e:
            logger.error(f"HAPI transaction failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to write to HAPI: {str(e)}"
            )

        # Extract created resource IDs from response
        composition_id = None
        list_ids = []
        document_reference_id = None
        provenance_id = None

        for entry in response_bundle.get("entry", []):
            response = entry.get("response", {})
            location = response.get("location", "")

            if "/Composition/" in location:
                composition_id = location.split("/Composition/")[1].split("/")[0]
            elif "/List/" in location:
                list_id = location.split("/List/")[1].split("/")[0]
                list_ids.append(list_id)
            elif "/DocumentReference/" in location:
                document_reference_id = location.split("/DocumentReference/")[1].split("/")[0]
            elif "/Provenance/" in location:
                provenance_id = location.split("/Provenance/")[1].split("/")[0]

        # Count created resources
        created_count = len([x for x in [composition_id, document_reference_id, provenance_id] if x]) + len(list_ids)

        return MaterializeResponse(
            success=True,
            message=f"Successfully materialized {created_count} FHIR resources",
            bundleId=bundle_id,
            compositionId=composition_id,
            listIds=list_ids,
            documentReferenceId=document_reference_id,
            provenanceId=provenance_id,
            errors=errors
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during materialization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error during materialization: {str(e)}"
        )


@router.get("/materialize/methods")
async def get_materialization_methods():
    """Get available materialization methods."""
    return {
        "methods": [
            {
                "name": "composition",
                "description": "Create a FHIR Composition resource with structured sections"
            },
            {
                "name": "lists",
                "description": "Create separate FHIR List resources for each category"
            },
            {
                "name": "document",
                "description": "Create a FHIR DocumentReference with markdown and PDF content"
            },
            {
                "name": "all",
                "description": "Create all resource types (Composition, Lists, DocumentReference)"
            }
        ]
    }


@router.post("/materialize/preview", response_model=Dict[str, Any])
async def preview_materialization(request: MaterializeRequest):
    """
    Preview the FHIR resources that would be created without writing to HAPI.
    """
    try:
        # Validate summary JSON
        try:
            summary_contract = SummaryContract(**request.summaryJSON)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid summary contract: {str(e)}"
            )

        # Use placeholder patient ID for preview
        patient_id = "preview-patient"

        # Decode PDF bytes if provided
        pdf_bytes = None
        if request.pdfBase64:
            try:
                pdf_bytes = base64.b64decode(request.pdfBase64)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid PDF base64: {str(e)}"
                )

        # Create transaction bundle
        bundle = create_summary_bundle(
            contract=summary_contract,
            patient_id=patient_id,
            method=request.method,
            author_display=request.authorDisplay or "Symphony AI",
            pdf_bytes=pdf_bytes,
            doc_ref_tags=request.docRefTags,
            source_bundle_ref=request.sourceBundleRef
        )

        return {
            "preview": True,
            "bundle": bundle,
            "resourceCount": len(bundle["entry"]),
            "resourceTypes": [entry["resource"]["resourceType"] for entry in bundle["entry"]]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating preview: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create preview: {str(e)}"
        )