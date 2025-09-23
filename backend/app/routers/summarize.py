"""Medical summary generation router."""

import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator
import logging

from ..adapters.fhir_client import HapiFHIRClient, FHIRClientError
from ..adapters.llm_base import LLMAdapter, MockLLMAdapter
from ..adapters.llm_anthropic import AnthropicAdapter
from ..adapters.llm_openai import OpenAIAdapter
from ..adapters.llm_gemini import GeminiAdapter
from ..schemas.summary_contract import SummaryContract, SummaryValidationError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["summarize"])


class SummarizeRequest(BaseModel):
    """Request model for summary generation."""
    patientRef: Optional[str] = Field(None, description="Patient reference (Patient/id)")
    localId: Optional[str] = Field(None, description="Local patient ID")
    useCase: str = Field("clinical_summary", description="Use case for summary")
    method: str = Field("comprehensive", description="Summary method")
    detailLevel: str = Field("standard", description="Level of detail (minimal|standard|detailed)")
    codingVerbosity: str = Field("minimal", description="Coding verbosity (none|minimal|full)")
    audience: str = Field("provider", description="Target audience (patient|provider)")
    model: Optional[str] = Field(None, description="Override model provider")
    temperature: float = Field(0.0, ge=0.0, le=1.0, description="LLM temperature")

    @validator("patientRef", "localId")
    def validate_patient_identifier(cls, v, values):
        if not v and not values.get("localId") and not values.get("patientRef"):
            raise ValueError("Either patientRef or localId must be provided")
        return v

    @validator("detailLevel")
    def validate_detail_level(cls, v):
        if v not in ["minimal", "standard", "detailed"]:
            raise ValueError("detailLevel must be minimal, standard, or detailed")
        return v

    @validator("codingVerbosity")
    def validate_coding_verbosity(cls, v):
        if v not in ["none", "minimal", "full"]:
            raise ValueError("codingVerbosity must be none, minimal, or full")
        return v

    @validator("audience")
    def validate_audience(cls, v):
        if v not in ["patient", "provider"]:
            raise ValueError("audience must be patient or provider")
        return v


def get_llm_adapter(model_override: Optional[str] = None) -> LLMAdapter:
    """Get the appropriate LLM adapter based on configuration."""
    provider = model_override or os.getenv("MODEL_PROVIDER", "mock")

    logger.info(f"Using LLM provider: {provider}")

    try:
        if provider.lower() == "anthropic":
            return AnthropicAdapter()
        elif provider.lower() == "openai":
            return OpenAIAdapter()
        elif provider.lower() in ["gemini", "google"]:
            return GeminiAdapter()
        elif provider.lower() == "mock":
            return MockLLMAdapter()
        else:
            logger.warning(f"Unknown provider {provider}, using mock")
            return MockLLMAdapter()
    except Exception as e:
        logger.error(f"Failed to initialize {provider} adapter: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize LLM provider: {str(e)}"
        )


async def fetch_patient_resources(
    patient_ref: str,
    hapi_client: HapiFHIRClient
) -> Dict[str, Any]:
    """Fetch patient-related resources from HAPI."""
    resources = {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": []
    }

    patient_id = patient_ref.replace("Patient/", "")

    try:
        patient = await hapi_client.read("Patient", patient_id)
        resources["entry"].append({"resource": patient})
    except FHIRClientError as e:
        logger.error(f"Failed to fetch patient: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient {patient_id} not found"
        )

    resource_types = [
        "Condition", "MedicationRequest", "AllergyIntolerance",
        "Observation", "Procedure", "Encounter"
    ]

    for resource_type in resource_types:
        try:
            search_params = {"patient": patient_id}
            bundle = await hapi_client.search(resource_type, search_params)

            for entry in bundle.get("entry", []):
                if "resource" in entry:
                    resources["entry"].append({"resource": entry["resource"]})

        except Exception as e:
            logger.warning(f"Failed to fetch {resource_type}: {str(e)}")

    logger.info(f"Fetched {len(resources['entry'])} resources for patient {patient_id}")
    return resources


def normalize_bundle_for_llm(bundle: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize and curate FHIR bundle for LLM processing."""
    curated = {
        "patient": None,
        "conditions": [],
        "medications": [],
        "allergies": [],
        "observations": [],
        "procedures": [],
        "encounters": []
    }

    for entry in bundle.get("entry", []):
        resource = entry.get("resource", {})
        resource_type = resource.get("resourceType")

        if resource_type == "Patient":
            curated["patient"] = {
                "id": resource.get("id"),
                "name": resource.get("name", []),
                "birthDate": resource.get("birthDate"),
                "gender": resource.get("gender")
            }
        elif resource_type == "Condition":
            curated["conditions"].append({
                "id": resource.get("id"),
                "code": resource.get("code"),
                "onsetDateTime": resource.get("onsetDateTime"),
                "clinicalStatus": resource.get("clinicalStatus")
            })
        elif resource_type == "MedicationRequest":
            curated["medications"].append({
                "id": resource.get("id"),
                "medicationCodeableConcept": resource.get("medicationCodeableConcept"),
                "status": resource.get("status"),
                "dosageInstruction": resource.get("dosageInstruction", [])
            })
        elif resource_type == "AllergyIntolerance":
            curated["allergies"].append({
                "id": resource.get("id"),
                "code": resource.get("code"),
                "reaction": resource.get("reaction", []),
                "onsetDateTime": resource.get("onsetDateTime")
            })
        elif resource_type == "Observation":
            curated["observations"].append({
                "id": resource.get("id"),
                "code": resource.get("code"),
                "valueQuantity": resource.get("valueQuantity"),
                "valueString": resource.get("valueString"),
                "effectiveDateTime": resource.get("effectiveDateTime"),
                "category": resource.get("category", [])
            })
        elif resource_type == "Procedure":
            curated["procedures"].append({
                "id": resource.get("id"),
                "code": resource.get("code"),
                "performedDateTime": resource.get("performedDateTime"),
                "performedPeriod": resource.get("performedPeriod")
            })
        elif resource_type == "Encounter":
            curated["encounters"].append({
                "id": resource.get("id"),
                "type": resource.get("type", []),
                "period": resource.get("period"),
                "location": resource.get("location", [])
            })

    return curated


@router.post("/summarize", response_model=SummaryContract, status_code=status.HTTP_200_OK)
async def generate_summary(request: SummarizeRequest):
    """
    Generate a medical summary from patient data.

    Process:
    1. Read patient-related resources from HAPI
    2. Normalize to input payload
    3. Call LLM adapter with validation
    4. Return contract-compliant JSON
    """
    hapi_client = HapiFHIRClient()

    if request.patientRef:
        patient_ref = request.patientRef
    else:
        patient_ref = f"Patient/{request.localId}"

    logger.info(f"Generating summary for {patient_ref}")

    try:
        raw_bundle = await fetch_patient_resources(patient_ref, hapi_client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch patient resources: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch patient data: {str(e)}"
        )

    normalized_bundle = normalize_bundle_for_llm(raw_bundle)

    llm_adapter = get_llm_adapter(request.model)

    params = {
        "useCase": request.useCase,
        "method": request.method,
        "detailLevel": request.detailLevel,
        "codingVerbosity": request.codingVerbosity,
        "temperature": request.temperature
    }

    try:
        summary = await llm_adapter.generate_summary(normalized_bundle, params)

        logger.info(f"Successfully generated summary with {len(summary.problems)} problems, "
                   f"{len(summary.medications)} medications")

        return summary

    except SummaryValidationError as e:
        logger.error(f"Summary validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Failed to generate valid summary",
                "errors": e.errors
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error generating summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )


@router.get("/summarize/schema", response_model=Dict[str, Any])
async def get_summary_schema():
    """Get the JSON schema for the summary contract."""
    return SummaryContract.schema()