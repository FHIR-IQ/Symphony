"""Export endpoints for patient bundles and artifacts."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.adapters.fhir_client import HapiFHIRClient
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os

router = APIRouter()

class ExportResponse(BaseModel):
    """Response model for export operations."""
    bundle: Dict[str, Any]
    resourceCount: int
    patientId: str

@router.get("/api/export/{patient_id}", response_model=ExportResponse)
async def export_patient_bundle(patient_id: str):
    """Export all resources and artifacts for a patient as a FHIR Bundle."""

    hapi_base = os.getenv("HAPI_BASE", "http://localhost:8080/fhir")
    client = HapiFHIRClient(hapi_base)

    try:
        # Search for all resources related to this patient
        resource_types = [
            "Patient", "Condition", "Observation", "MedicationRequest",
            "AllergyIntolerance", "Procedure", "Encounter", "Composition",
            "List", "DocumentReference", "Provenance"
        ]

        bundle_entries = []

        for resource_type in resource_types:
            try:
                if resource_type == "Patient":
                    # Direct patient lookup
                    if patient_id.startswith("Patient/"):
                        patient_id_only = patient_id.split("/")[1]
                    else:
                        patient_id_only = patient_id

                    patient = await client.get_resource("Patient", patient_id_only)
                    if patient:
                        bundle_entries.append({
                            "resource": patient,
                            "request": {
                                "method": "GET",
                                "url": f"Patient/{patient_id_only}"
                            }
                        })
                else:
                    # Search for resources by patient reference
                    if resource_type in ["Composition", "List", "DocumentReference"]:
                        # These might use subject or patient
                        search_results = await client.search(resource_type, params={
                            "subject": patient_id if patient_id.startswith("Patient/") else f"Patient/{patient_id}"
                        })
                    else:
                        # Standard patient reference
                        search_results = await client.search(resource_type, params={
                            "patient": patient_id if patient_id.startswith("Patient/") else f"Patient/{patient_id}"
                        })

                    if search_results and "entry" in search_results:
                        for entry in search_results["entry"]:
                            if "resource" in entry:
                                bundle_entries.append({
                                    "resource": entry["resource"],
                                    "request": {
                                        "method": "GET",
                                        "url": f"{resource_type}/{entry['resource']['id']}"
                                    }
                                })

            except Exception as e:
                # Log but continue with other resource types
                print(f"Error searching {resource_type}: {e}")
                continue

        # Create export bundle
        export_bundle = {
            "resourceType": "Bundle",
            "id": f"export-{patient_id.replace('/', '-')}",
            "type": "collection",
            "timestamp": "2024-01-01T00:00:00Z",  # Should be current timestamp
            "total": len(bundle_entries),
            "entry": bundle_entries
        }

        return ExportResponse(
            bundle=export_bundle,
            resourceCount=len(bundle_entries),
            patientId=patient_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export patient bundle: {str(e)}"
        )

@router.get("/api/export/{patient_id}/summary")
async def export_patient_summary(patient_id: str):
    """Export only Symphony-created artifacts for a patient."""

    hapi_base = os.getenv("HAPI_BASE", "http://localhost:8080/fhir")
    client = HapiFHIRClient(hapi_base)

    try:
        bundle_entries = []

        # Search for Symphony-created resources
        symphony_types = ["Composition", "List", "DocumentReference", "Provenance"]

        for resource_type in symphony_types:
            try:
                # Search with Symphony author tag
                search_results = await client.search(resource_type, params={
                    "subject": patient_id if patient_id.startswith("Patient/") else f"Patient/{patient_id}",
                })

                if search_results and "entry" in search_results:
                    for entry in search_results["entry"]:
                        if "resource" in entry:
                            resource = entry["resource"]
                            # Filter for Symphony-created resources
                            if (resource_type == "Composition" and
                                any("Symphony" in str(author.get("display", ""))
                                    for author in resource.get("author", []))):
                                bundle_entries.append({
                                    "resource": resource,
                                    "request": {
                                        "method": "GET",
                                        "url": f"{resource_type}/{resource['id']}"
                                    }
                                })
                            elif resource_type in ["List", "DocumentReference", "Provenance"]:
                                # Include all Lists, Documents, and Provenance for now
                                bundle_entries.append({
                                    "resource": resource,
                                    "request": {
                                        "method": "GET",
                                        "url": f"{resource_type}/{resource['id']}"
                                    }
                                })

            except Exception as e:
                print(f"Error searching {resource_type}: {e}")
                continue

        summary_bundle = {
            "resourceType": "Bundle",
            "id": f"summary-export-{patient_id.replace('/', '-')}",
            "type": "collection",
            "timestamp": "2024-01-01T00:00:00Z",
            "total": len(bundle_entries),
            "entry": bundle_entries
        }

        return {
            "bundle": summary_bundle,
            "resourceCount": len(bundle_entries),
            "patientId": patient_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export patient summary: {str(e)}"
        )