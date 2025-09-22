"""Strict JSON schema for medical summary contract."""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator


class Code(BaseModel):
    """FHIR-compatible code representation."""
    system: str = Field(..., description="Code system URI")
    code: str = Field(..., description="Code value")
    display: Optional[str] = Field(None, description="Human-readable display text")


class Item(BaseModel):
    """Base item for problems, medications, allergies, procedures."""
    display: str = Field(..., description="Human-readable display text")
    codes: List[Code] = Field(default_factory=list, description="Associated codes")
    onsetDate: Optional[str] = Field(None, description="Onset or start date (YYYY-MM-DD)")
    provenance: str = Field(..., description="Resource reference (e.g., 'Condition/123')")

    @field_validator("provenance")
    @classmethod
    def validate_provenance(cls, v):
        if not v or "/" not in v:
            raise ValueError("Provenance must be in format 'ResourceType/id'")
        parts = v.split("/")
        if len(parts) != 2 or not parts[0] or not parts[1]:
            raise ValueError("Provenance must be in format 'ResourceType/id'")
        return v


class MedicationItem(Item):
    """Medication-specific item."""
    status: Optional[str] = Field(None, description="Medication status (active, completed, etc.)")
    dosage: Optional[str] = Field(None, description="Medication dosage information")


class ObservationItem(BaseModel):
    """Observation item for vitals and labs."""
    display: str = Field(..., description="Human-readable display text")
    value: str = Field(..., description="Observation value with units")
    codes: List[Code] = Field(default_factory=list, description="Associated codes")
    date: Optional[str] = Field(None, description="Observation date (YYYY-MM-DD)")
    provenance: str = Field(..., description="Resource reference (e.g., 'Observation/123')")

    @field_validator("provenance")
    @classmethod
    def validate_provenance(cls, v):
        if not v or "/" not in v:
            raise ValueError("Provenance must be in format 'ResourceType/id'")
        return v


class EncounterItem(BaseModel):
    """Encounter-specific item."""
    display: str = Field(..., description="Encounter description")
    type: str = Field(..., description="Encounter type")
    period: Optional[Dict[str, Optional[str]]] = Field(None, description="Period with start and end dates")
    location: Optional[str] = Field(None, description="Encounter location")
    provenance: str = Field(..., description="Resource reference (e.g., 'Encounter/123')")

    @field_validator("provenance")
    @classmethod
    def validate_provenance(cls, v):
        if not v or "/" not in v:
            raise ValueError("Provenance must be in format 'ResourceType/id'")
        return v


class SummaryContract(BaseModel):
    """Strict contract for medical summary output."""
    problems: List[Item] = Field(
        default_factory=list,
        description="List of medical problems/conditions"
    )
    medications: List[MedicationItem] = Field(
        default_factory=list,
        description="List of medications"
    )
    allergies: List[Item] = Field(
        default_factory=list,
        description="List of allergies and intolerances"
    )
    vitals: List[ObservationItem] = Field(
        default_factory=list,
        description="List of vital signs"
    )
    labs: List[ObservationItem] = Field(
        default_factory=list,
        description="List of laboratory results"
    )
    procedures: List[Item] = Field(
        default_factory=list,
        description="List of procedures"
    )
    encounters: List[EncounterItem] = Field(
        default_factory=list,
        description="List of encounters"
    )
    careGaps: List[str] = Field(
        default_factory=list,
        description="Identified gaps in care"
    )
    dataQualityNotes: List[str] = Field(
        default_factory=list,
        description="Notes about data quality or missing information"
    )

    class Config:
        schema_extra = {
            "example": {
                "problems": [
                    {
                        "display": "Type 2 Diabetes Mellitus",
                        "codes": [
                            {
                                "system": "http://snomed.info/sct",
                                "code": "44054006",
                                "display": "Type 2 diabetes mellitus"
                            }
                        ],
                        "onsetDate": "2020-01-15",
                        "provenance": "Condition/123"
                    }
                ],
                "medications": [
                    {
                        "display": "Metformin 500mg twice daily",
                        "codes": [
                            {
                                "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                                "code": "6809",
                                "display": "Metformin"
                            }
                        ],
                        "status": "active",
                        "provenance": "MedicationRequest/456"
                    }
                ],
                "allergies": [
                    {
                        "display": "Penicillin allergy - rash",
                        "codes": [
                            {
                                "system": "http://snomed.info/sct",
                                "code": "91936005",
                                "display": "Penicillin allergy"
                            }
                        ],
                        "onsetDate": "2015-03-01",
                        "provenance": "AllergyIntolerance/789"
                    }
                ],
                "vitals": [
                    {
                        "display": "Blood Pressure",
                        "value": "130/85 mmHg",
                        "codes": [
                            {
                                "system": "http://loinc.org",
                                "code": "85354-9",
                                "display": "Blood pressure panel"
                            }
                        ],
                        "date": "2024-01-15",
                        "provenance": "Observation/321"
                    }
                ],
                "labs": [
                    {
                        "display": "HbA1c",
                        "value": "7.2 %",
                        "codes": [
                            {
                                "system": "http://loinc.org",
                                "code": "4548-4",
                                "display": "Hemoglobin A1c"
                            }
                        ],
                        "date": "2024-01-10",
                        "provenance": "Observation/654"
                    }
                ],
                "procedures": [
                    {
                        "display": "Appendectomy",
                        "codes": [
                            {
                                "system": "http://snomed.info/sct",
                                "code": "80146002",
                                "display": "Appendectomy"
                            }
                        ],
                        "onsetDate": "2022-05-15",
                        "provenance": "Procedure/987"
                    }
                ],
                "encounters": [
                    {
                        "display": "Annual wellness visit",
                        "type": "ambulatory",
                        "period": {
                            "start": "2024-01-15",
                            "end": "2024-01-15"
                        },
                        "location": "Primary Care Clinic",
                        "provenance": "Encounter/246"
                    }
                ],
                "careGaps": [
                    "Overdue for annual eye exam (diabetic retinopathy screening)",
                    "No documented pneumonia vaccine"
                ],
                "dataQualityNotes": [
                    "Limited historical data before 2020",
                    "Some lab results missing reference ranges"
                ]
            }
        }

    def to_fhir_bundle(self) -> Dict[str, Any]:
        """Convert summary to a basic FHIR Bundle structure."""
        entries = []

        for problem in self.problems:
            if problem.provenance.startswith("Condition/"):
                entries.append({
                    "resource": {
                        "resourceType": "Condition",
                        "id": problem.provenance.split("/")[1],
                        "code": {
                            "coding": [code.dict() for code in problem.codes],
                            "text": problem.display
                        }
                    }
                })

        return {
            "resourceType": "Bundle",
            "type": "collection",
            "entry": entries
        }


class SummaryValidationError(Exception):
    """Exception raised when summary validation fails."""
    def __init__(self, message: str, errors: List[str] = None):
        super().__init__(message)
        self.errors = errors or []