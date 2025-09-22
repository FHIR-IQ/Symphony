"""
Test suite for end-to-end fidelity preservation.
Ensures provenance and coding information is correctly preserved through the entire pipeline.
"""

import pytest
from unittest.mock import Mock, patch
from app.schemas.summary_contract import SummaryContract
from app.adapters.llm_base import LLMAdapter
from app.services.materialize import to_composition, to_lists
from app.adapters.fhir_client import HapiFHIRClient


class TestFidelityPreservation:
    """Test that provenance and codes are preserved end-to-end."""

    @pytest.fixture
    def curated_input_bundle(self):
        """Small curated FHIR bundle with known resources and codes."""
        return {
            "resourceType": "Bundle",
            "id": "test-bundle-1",
            "type": "collection",
            "entry": [
                {
                    "resource": {
                        "resourceType": "Patient",
                        "id": "patient-1",
                        "name": [{"family": "Doe", "given": ["John"]}],
                        "birthDate": "1975-08-15"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Condition",
                        "id": "cond-1",
                        "subject": {"reference": "Patient/patient-1"},
                        "code": {
                            "coding": [
                                {
                                    "system": "http://snomed.info/sct",
                                    "code": "44054006",
                                    "display": "Type 2 diabetes mellitus"
                                }
                            ],
                            "text": "Type 2 Diabetes Mellitus"
                        },
                        "clinicalStatus": {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                    "code": "active"
                                }
                            ]
                        },
                        "onsetDateTime": "2020-01-15"
                    }
                },
                {
                    "resource": {
                        "resourceType": "MedicationRequest",
                        "id": "med-1",
                        "subject": {"reference": "Patient/patient-1"},
                        "medicationCodeableConcept": {
                            "coding": [
                                {
                                    "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                                    "code": "860975",
                                    "display": "metformin hydrochloride 500 MG Oral Tablet"
                                }
                            ],
                            "text": "Metformin 500mg"
                        },
                        "status": "active",
                        "intent": "order"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "id": "obs-1",
                        "subject": {"reference": "Patient/patient-1"},
                        "code": {
                            "coding": [
                                {
                                    "system": "http://loinc.org",
                                    "code": "4548-4",
                                    "display": "Hemoglobin A1c/Hemoglobin.total in Blood"
                                }
                            ],
                            "text": "HbA1c"
                        },
                        "valueQuantity": {
                            "value": 7.2,
                            "unit": "%",
                            "system": "http://unitsofmeasure.org",
                            "code": "%"
                        },
                        "status": "final",
                        "effectiveDateTime": "2023-11-15"
                    }
                }
            ]
        }

    @pytest.fixture
    def expected_llm_output(self):
        """Expected LLM output that preserves provenance correctly."""
        return {
            "problems": [
                {
                    "display": "Type 2 diabetes mellitus",
                    "codes": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "44054006",
                            "display": "Type 2 diabetes mellitus"
                        }
                    ],
                    "provenance": "Condition/cond-1",
                    "onsetDate": "2020-01-15"
                }
            ],
            "medications": [
                {
                    "display": "Metformin 500mg",
                    "codes": [
                        {
                            "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                            "code": "860975",
                            "display": "metformin hydrochloride 500 MG Oral Tablet"
                        }
                    ],
                    "provenance": "MedicationRequest/med-1",
                    "status": "active"
                }
            ],
            "allergies": [],
            "vitals": [],
            "labs": [
                {
                    "display": "HbA1c",
                    "value": "7.2%",
                    "codes": [
                        {
                            "system": "http://loinc.org",
                            "code": "4548-4",
                            "display": "Hemoglobin A1c/Hemoglobin.total in Blood"
                        }
                    ],
                    "provenance": "Observation/obs-1"
                }
            ],
            "procedures": [],
            "encounters": [],
            "careGaps": [
                "Consider diabetic foot exam",
                "Evaluate need for statin therapy"
            ],
            "dataQualityNotes": [
                "Recent HbA1c available",
                "Medication compliance status unclear"
            ]
        }

    @pytest.fixture
    def mock_llm_adapter(self, expected_llm_output):
        """Mock LLM adapter that returns predictable output."""
        mock_adapter = Mock(spec=LLMAdapter)
        mock_adapter.generate.return_value = expected_llm_output
        return mock_adapter

    @pytest.fixture
    def mock_hapi_client(self):
        """Mock HAPI client to avoid network calls."""
        mock_client = Mock(spec=HapiFHIRClient)
        mock_client.create_resource.return_value = {"id": "generated-id"}
        mock_client.create_bundle.return_value = {"id": "bundle-id"}
        return mock_client

    def test_provenance_preservation_through_pipeline(self, curated_input_bundle, mock_llm_adapter, expected_llm_output):
        """Test that provenance is correctly preserved through the entire pipeline."""
        # Simulate the full pipeline: Bundle -> LLM -> SummaryContract -> FHIR Resources

        # Step 1: LLM processing (mocked)
        patient_ref = "Patient/patient-1"
        llm_output = mock_llm_adapter.generate(curated_input_bundle, patient_ref)

        # Step 2: Validate SummaryContract
        summary_contract = SummaryContract(**llm_output)

        # Step 3: Verify provenance preservation
        assert len(summary_contract.problems) == 1
        assert summary_contract.problems[0].provenance == "Condition/cond-1"
        assert summary_contract.problems[0].codes[0]["system"] == "http://snomed.info/sct"
        assert summary_contract.problems[0].codes[0]["code"] == "44054006"

        assert len(summary_contract.medications) == 1
        assert summary_contract.medications[0].provenance == "MedicationRequest/med-1"
        assert summary_contract.medications[0].codes[0]["system"] == "http://www.nlm.nih.gov/research/umls/rxnorm"
        assert summary_contract.medications[0].codes[0]["code"] == "860975"

        assert len(summary_contract.labs) == 1
        assert summary_contract.labs[0].provenance == "Observation/obs-1"
        assert summary_contract.labs[0].codes[0]["system"] == "http://loinc.org"
        assert summary_contract.labs[0].codes[0]["code"] == "4548-4"

    def test_materialization_preserves_provenance(self, expected_llm_output):
        """Test that materialization preserves provenance and codes."""
        summary_contract = SummaryContract(**expected_llm_output)

        # Create Composition
        composition = to_composition(
            summary_contract=summary_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        # Verify provenance in Composition sections
        problems_section = next(s for s in composition["section"] if s["title"] == "Problems")
        assert len(problems_section["entry"]) == 1
        assert problems_section["entry"][0]["reference"] == "Condition/cond-1"

        medications_section = next(s for s in composition["section"] if s["title"] == "Medications")
        assert len(medications_section["entry"]) == 1
        assert medications_section["entry"][0]["reference"] == "MedicationRequest/med-1"

        labs_section = next(s for s in composition["section"] if s["title"] == "Labs")
        assert len(labs_section["entry"]) == 1
        assert labs_section["entry"][0]["reference"] == "Observation/obs-1"

        # Create Lists
        lists = to_lists(
            summary_contract=summary_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        # Verify provenance in Lists
        problems_list = next(l for l in lists if l["title"] == "Problems")
        assert len(problems_list["entry"]) == 1
        assert problems_list["entry"][0]["item"]["reference"] == "Condition/cond-1"

        medications_list = next(l for l in lists if l["title"] == "Medications")
        assert len(medications_list["entry"]) == 1
        assert medications_list["entry"][0]["item"]["reference"] == "MedicationRequest/med-1"

    def test_coding_system_preservation(self, expected_llm_output):
        """Test that all coding systems are preserved correctly."""
        summary_contract = SummaryContract(**expected_llm_output)

        # Verify SNOMED codes for problems
        problem = summary_contract.problems[0]
        snomed_code = next(c for c in problem.codes if c["system"] == "http://snomed.info/sct")
        assert snomed_code["code"] == "44054006"
        assert snomed_code["display"] == "Type 2 diabetes mellitus"

        # Verify RxNorm codes for medications
        medication = summary_contract.medications[0]
        rxnorm_code = next(c for c in medication.codes if c["system"] == "http://www.nlm.nih.gov/research/umls/rxnorm")
        assert rxnorm_code["code"] == "860975"
        assert "metformin" in rxnorm_code["display"].lower()

        # Verify LOINC codes for labs
        lab = summary_contract.labs[0]
        loinc_code = next(c for c in lab.codes if c["system"] == "http://loinc.org")
        assert loinc_code["code"] == "4548-4"
        assert "hemoglobin a1c" in loinc_code["display"].lower()

    def test_invalid_provenance_fails_validation(self):
        """Test that invalid provenance formats fail validation."""
        invalid_output = {
            "problems": [
                {
                    "display": "Type 2 diabetes mellitus",
                    "codes": [{"system": "http://snomed.info/sct", "code": "44054006"}],
                    "provenance": "invalid-format"  # Missing ResourceType/id format
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
        }

        with pytest.raises(Exception):  # Should raise validation error
            SummaryContract(**invalid_output)

    def test_missing_required_codes_fails_validation(self):
        """Test that missing codes array fails validation."""
        invalid_output = {
            "problems": [
                {
                    "display": "Type 2 diabetes mellitus",
                    "provenance": "Condition/cond-1"
                    # Missing required 'codes' field
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
        }

        with pytest.raises(Exception):  # Should raise validation error
            SummaryContract(**invalid_output)

    @patch('app.adapters.fhir_client.HapiFHIRClient')
    def test_no_network_calls_in_unit_tests(self, mock_hapi_class, expected_llm_output):
        """Test that unit tests don't make actual network calls."""
        # Setup mock
        mock_client_instance = Mock()
        mock_hapi_class.return_value = mock_client_instance

        # Simulate creating resources
        summary_contract = SummaryContract(**expected_llm_output)
        composition = to_composition(
            summary_contract=summary_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        # Verify no actual FHIR client was instantiated in this test
        # (The composition creation doesn't require network calls)
        assert composition["resourceType"] == "Composition"

        # If we were to use the FHIR client, it would be mocked
        mock_hapi_class.assert_not_called()  # No network client needed for resource creation

    def test_end_to_end_data_flow(self, curated_input_bundle, mock_llm_adapter, expected_llm_output):
        """Test complete data flow from input bundle to materialized resources."""
        # Step 1: Process bundle with LLM (mocked)
        patient_ref = "Patient/patient-1"
        llm_output = mock_llm_adapter.generate(curated_input_bundle, patient_ref)

        # Step 2: Create and validate SummaryContract
        summary_contract = SummaryContract(**llm_output)

        # Step 3: Materialize to FHIR resources
        composition = to_composition(
            summary_contract=summary_contract,
            patient_id=patient_ref,
            author_display="Symphony AI Wizard"
        )

        lists = to_lists(
            summary_contract=summary_contract,
            patient_id=patient_ref,
            author_display="Symphony AI Wizard"
        )

        # Step 4: Verify complete fidelity
        # Original input had Condition/cond-1 with SNOMED 44054006
        # This should be preserved through the entire pipeline

        # Check in Composition
        problems_section = next(s for s in composition["section"] if s["title"] == "Problems")
        assert problems_section["entry"][0]["reference"] == "Condition/cond-1"

        # Check in Lists
        problems_list = next(l for l in lists if l["title"] == "Problems")
        assert problems_list["entry"][0]["item"]["reference"] == "Condition/cond-1"

        # Verify the SummaryContract maintains the original codes
        original_condition = next(
            e["resource"] for e in curated_input_bundle["entry"]
            if e["resource"]["resourceType"] == "Condition"
        )
        summary_problem = summary_contract.problems[0]

        original_snomed = original_condition["code"]["coding"][0]
        summary_snomed = summary_problem.codes[0]

        assert original_snomed["system"] == summary_snomed["system"]
        assert original_snomed["code"] == summary_snomed["code"]
        assert summary_problem.provenance == f"Condition/{original_condition['id']}"