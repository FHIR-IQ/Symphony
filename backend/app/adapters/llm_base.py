"""Base interface for LLM adapters."""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging
import json
from pydantic import ValidationError

from ..schemas.summary_contract import SummaryContract, SummaryValidationError

logger = logging.getLogger(__name__)


class LLMAdapter(ABC):
    """Abstract base class for LLM adapters."""

    def __init__(self):
        self.provider_name = self.__class__.__name__

    @abstractmethod
    async def _call_model(
        self,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        json_mode: bool = True
    ) -> str:
        """Call the specific LLM provider's API."""
        pass

    def _create_summary_prompt(
        self,
        input_bundle: Dict[str, Any],
        params: Dict[str, Any]
    ) -> str:
        """Create the prompt for summary generation."""
        use_case = params.get("useCase", "clinical_summary")
        detail_level = params.get("detailLevel", "standard")
        coding_verbosity = params.get("codingVerbosity", "minimal")

        prompt = f"""You are a medical data analyst. Generate a structured medical summary from the provided FHIR resources.

IMPORTANT: You must respond with ONLY valid JSON that conforms to this exact schema:

{{
  "problems": [
    {{
      "display": "string - human readable condition name",
      "codes": [
        {{
          "system": "string - code system URI",
          "code": "string - code value",
          "display": "string - optional display text"
        }}
      ],
      "onsetDate": "YYYY-MM-DD or null",
      "provenance": "ResourceType/id - MUST match a resource ID from input"
    }}
  ],
  "medications": [
    {{
      "display": "string - medication name, dose, frequency",
      "codes": [/* same structure as above */],
      "status": "active|completed|stopped|on-hold or null",
      "onsetDate": "YYYY-MM-DD or null",
      "provenance": "MedicationRequest/id"
    }}
  ],
  "allergies": [/* same structure as problems */],
  "vitals": [
    {{
      "display": "string - vital sign name",
      "value": "string - value with units",
      "codes": [/* same structure */],
      "date": "YYYY-MM-DD or null",
      "provenance": "Observation/id"
    }}
  ],
  "labs": [/* same structure as vitals */],
  "procedures": [/* same structure as problems */],
  "encounters": [
    {{
      "display": "string - encounter description",
      "type": "string - encounter type",
      "period": {{
        "start": "YYYY-MM-DD or null",
        "end": "YYYY-MM-DD or null"
      }},
      "location": "string or null",
      "provenance": "Encounter/id"
    }}
  ],
  "careGaps": ["string - identified care gaps"],
  "dataQualityNotes": ["string - data quality observations"]
}}

Rules:
1. ALL provenance fields MUST reference actual resource IDs from the input
2. Use empty arrays [] if no data available for a section
3. Dates must be in YYYY-MM-DD format or null
4. Include appropriate medical codes when available
5. Detail level: {detail_level}
6. Coding verbosity: {coding_verbosity}
7. Use case focus: {use_case}

Input FHIR Bundle:
{json.dumps(input_bundle, indent=2)}

Remember: Output ONLY valid JSON, no markdown, no explanations."""

        return prompt

    def _create_correction_prompt(
        self,
        original_output: str,
        validation_errors: str
    ) -> str:
        """Create a correction prompt when validation fails."""
        return f"""Your previous JSON output had validation errors. Please fix and return ONLY corrected JSON.

Validation errors:
{validation_errors}

Your previous output:
{original_output}

Return ONLY the corrected JSON that fixes these validation errors. Ensure:
1. All required fields are present
2. Provenance fields follow 'ResourceType/id' format
3. Dates are in YYYY-MM-DD format or null
4. Arrays are used even if empty
5. No markdown formatting, just raw JSON"""

    async def generate_summary(
        self,
        input_bundle: Dict[str, Any],
        params: Optional[Dict[str, Any]] = None
    ) -> SummaryContract:
        """Generate a medical summary from FHIR resources."""
        params = params or {}
        temperature = params.get("temperature", 0.0)
        max_retries = 2

        prompt = self._create_summary_prompt(input_bundle, params)

        for attempt in range(max_retries):
            try:
                logger.info(f"Calling {self.provider_name} (attempt {attempt + 1}/{max_retries})")

                raw_output = await self._call_model(
                    prompt=prompt,
                    temperature=temperature if attempt == 0 else 0.0,
                    max_tokens=4096,
                    json_mode=True
                )

                raw_output = raw_output.strip()
                if raw_output.startswith("```json"):
                    raw_output = raw_output[7:]
                if raw_output.startswith("```"):
                    raw_output = raw_output[3:]
                if raw_output.endswith("```"):
                    raw_output = raw_output[:-3]
                raw_output = raw_output.strip()

                try:
                    json_data = json.loads(raw_output)
                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error: {str(e)}")
                    if attempt == 0:
                        prompt = self._create_correction_prompt(
                            raw_output,
                            f"Invalid JSON: {str(e)}"
                        )
                        continue
                    raise SummaryValidationError(f"Failed to parse JSON: {str(e)}")

                try:
                    summary = SummaryContract(**json_data)
                    logger.info(f"Successfully validated summary on attempt {attempt + 1}")
                    return summary
                except ValidationError as e:
                    logger.error(f"Validation error: {str(e)}")
                    if attempt == 0:
                        error_details = "\n".join([
                            f"- {err['loc']}: {err['msg']}"
                            for err in e.errors()
                        ])
                        prompt = self._create_correction_prompt(
                            raw_output,
                            error_details
                        )
                        continue
                    raise SummaryValidationError(
                        f"Schema validation failed: {str(e)}",
                        errors=[str(err) for err in e.errors()]
                    )

            except Exception as e:
                if isinstance(e, SummaryValidationError):
                    raise
                logger.error(f"Error in {self.provider_name}: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                continue

        raise SummaryValidationError("Failed to generate valid summary after retries")


class MockLLMAdapter(LLMAdapter):
    """Mock adapter for testing."""

    async def _call_model(
        self,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        json_mode: bool = True
    ) -> str:
        """Return mock JSON response."""
        return json.dumps({
            "problems": [
                {
                    "display": "Type 2 Diabetes",
                    "codes": [{
                        "system": "http://snomed.info/sct",
                        "code": "44054006"
                    }],
                    "onsetDate": "2020-01-15",
                    "provenance": "Condition/123"
                }
            ],
            "medications": [],
            "allergies": [],
            "vitals": [],
            "labs": [],
            "procedures": [],
            "encounters": [],
            "careGaps": [],
            "dataQualityNotes": []
        })