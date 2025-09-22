"""
Basic functionality tests for Symphony core components.
Covers essential validation and API functionality.
"""

import pytest
from app.schemas.summary_contract import SummaryContract
from pydantic import ValidationError


class TestBasicValidation:
    """Test basic SummaryContract validation."""

    def test_empty_contract_valid(self):
        """Test that empty contract is valid."""
        contract = SummaryContract()
        assert len(contract.problems) == 0
        assert len(contract.medications) == 0
        assert len(contract.careGaps) == 0

    def test_minimal_valid_contract(self):
        """Test minimal valid contract."""
        payload = {
            "problems": [{
                "display": "Diabetes",
                "codes": [{"system": "http://snomed.info/sct", "code": "73211009"}],
                "provenance": "Condition/123"
            }],
            "medications": [],
            "allergies": [],
            "vitals": [],
            "labs": [],
            "procedures": [],
            "encounters": [],
            "careGaps": ["Annual eye exam"],
            "dataQualityNotes": ["Data complete"]
        }

        contract = SummaryContract(**payload)
        assert len(contract.problems) == 1
        assert contract.problems[0].display == "Diabetes"
        assert contract.problems[0].provenance == "Condition/123"

    def test_medication_with_status(self):
        """Test medication with status field."""
        payload = {
            "problems": [],
            "medications": [{
                "display": "Metformin",
                "codes": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "6809"}],
                "provenance": "MedicationRequest/456",
                "status": "active"
            }],
            "allergies": [],
            "vitals": [],
            "labs": [],
            "procedures": [],
            "encounters": [],
            "careGaps": [],
            "dataQualityNotes": []
        }

        contract = SummaryContract(**payload)
        assert len(contract.medications) == 1
        assert contract.medications[0].status == "active"

    def test_vitals_with_value(self):
        """Test vitals with value field."""
        payload = {
            "problems": [],
            "medications": [],
            "allergies": [],
            "vitals": [{
                "display": "Blood Pressure",
                "value": "120/80",
                "codes": [{"system": "http://loinc.org", "code": "85354-9"}],
                "provenance": "Observation/789"
            }],
            "labs": [],
            "procedures": [],
            "encounters": [],
            "careGaps": [],
            "dataQualityNotes": []
        }

        contract = SummaryContract(**payload)
        assert len(contract.vitals) == 1
        assert contract.vitals[0].value == "120/80"

    def test_invalid_provenance_rejected(self):
        """Test that invalid provenance format is rejected."""
        payload = {
            "problems": [{
                "display": "Diabetes",
                "codes": [{"system": "http://snomed.info/sct", "code": "73211009"}],
                "provenance": "invalid"  # Missing /
            }],
            "medications": [],
            "allergies": [],
            "vitals": [],
            "labs": [],
            "procedures": [],
            "encounters": [],
            "careGaps": [],
            "dataQualityNotes": []
        }

        with pytest.raises(ValidationError):
            SummaryContract(**payload)


class TestProvenance:
    """Test provenance validation specifically."""

    def test_valid_provenance_formats(self):
        """Test various valid provenance formats."""
        valid_provenances = [
            "Condition/123",
            "MedicationRequest/abc-def",
            "Observation/uuid-1234-5678",
            "Patient/patient-id"
        ]

        for provenance in valid_provenances:
            payload = {
                "problems": [{
                    "display": "Test",
                    "codes": [{"system": "http://snomed.info/sct", "code": "123"}],
                    "provenance": provenance
                }],
                "medications": [],
                "allergies": [],
                "vitals": [],
                "labs": [],
                "procedures": [],
                "encounters": [],
                "careGaps": [],
                "dataQualityNotes": []
            }

            # Should not raise
            contract = SummaryContract(**payload)
            assert contract.problems[0].provenance == provenance

    def test_invalid_provenance_formats(self):
        """Test various invalid provenance formats."""
        invalid_provenances = [
            "NoSlash",
            "",
            "/",
            "Condition/",
            "/123"
        ]

        for provenance in invalid_provenances:
            payload = {
                "problems": [{
                    "display": "Test",
                    "codes": [{"system": "http://snomed.info/sct", "code": "123"}],
                    "provenance": provenance
                }],
                "medications": [],
                "allergies": [],
                "vitals": [],
                "labs": [],
                "procedures": [],
                "encounters": [],
                "careGaps": [],
                "dataQualityNotes": []
            }

            with pytest.raises(ValidationError):
                SummaryContract(**payload)


class TestJSONContract:
    """Test JSON serialization and contract compliance."""

    def test_json_roundtrip(self):
        """Test that contract can be serialized and deserialized."""
        original_data = {
            "problems": [{
                "display": "Type 2 Diabetes",
                "codes": [{"system": "http://snomed.info/sct", "code": "44054006"}],
                "provenance": "Condition/dm-123"
            }],
            "medications": [{
                "display": "Metformin 500mg",
                "codes": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "6809"}],
                "provenance": "MedicationRequest/met-456",
                "status": "active"
            }],
            "allergies": [],
            "vitals": [],
            "labs": [],
            "procedures": [],
            "encounters": [],
            "careGaps": ["Annual foot exam"],
            "dataQualityNotes": ["Recent data"]
        }

        # Create contract
        contract = SummaryContract(**original_data)

        # Serialize to JSON
        json_str = contract.model_dump_json()

        # Deserialize back
        import json
        parsed_data = json.loads(json_str)
        new_contract = SummaryContract(**parsed_data)

        # Verify data integrity
        assert len(new_contract.problems) == 1
        assert new_contract.problems[0].display == "Type 2 Diabetes"
        assert len(new_contract.medications) == 1
        assert new_contract.medications[0].status == "active"
        assert len(new_contract.careGaps) == 1
        assert new_contract.careGaps[0] == "Annual foot exam"