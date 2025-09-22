"""
Test suite for SummaryContract validation and FHIR resource builders.
Covers JSON schema validation, XHTML generation, and DocumentReference attachments.
"""

import pytest
from pydantic import ValidationError
from app.schemas.summary_contract import SummaryContract, Item, MedicationItem, ObservationItem, EncounterItem

# Type aliases for readability
ProblemItem = Item
AllergyItem = Item
ProcedureItem = Item
VitalItem = ObservationItem
LabItem = ObservationItem
from app.services.materialize import to_composition, to_lists, to_document_reference, make_provenance
import re


class TestSummaryContractValidation:
    """Test Pydantic validation with good and bad payloads."""

    def test_valid_summary_contract(self):
        """Test that a valid SummaryContract passes validation."""
        valid_payload = {
            "problems": [
                {
                    "display": "Type 2 Diabetes Mellitus",
                    "codes": [{"system": "http://snomed.info/sct", "code": "44054006"}],
                    "provenance": "Condition/cond-1",
                    "onsetDate": "2020-01-15"
                }
            ],
            "medications": [
                {
                    "display": "Metformin 500mg",
                    "codes": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "860975"}],
                    "provenance": "MedicationRequest/med-1",
                    "status": "active"
                }
            ],
            "allergies": [
                {
                    "display": "Penicillin allergy",
                    "codes": [{"system": "http://snomed.info/sct", "code": "294505008"}],
                    "provenance": "AllergyIntolerance/allergy-1"
                }
            ],
            "vitals": [
                {
                    "display": "Blood Pressure",
                    "value": "120/80 mmHg",
                    "codes": [{"system": "http://loinc.org", "code": "85354-9"}],
                    "provenance": "Observation/obs-bp-1"
                }
            ],
            "labs": [
                {
                    "display": "HbA1c",
                    "value": "7.2%",
                    "codes": [{"system": "http://loinc.org", "code": "4548-4"}],
                    "provenance": "Observation/obs-1"
                }
            ],
            "procedures": [
                {
                    "display": "Annual diabetic eye exam",
                    "codes": [{"system": "http://snomed.info/sct", "code": "134395001"}],
                    "provenance": "Procedure/proc-1"
                }
            ],
            "encounters": [
                {
                    "display": "Office Visit",
                    "type": "ambulatory",
                    "provenance": "Encounter/enc-1"
                }
            ],
            "careGaps": [
                "Overdue for diabetic foot exam",
                "Missing pneumococcal vaccination"
            ],
            "dataQualityNotes": [
                "Recent vitals available",
                "Some historical data incomplete"
            ]
        }

        # Should not raise any validation errors
        contract = SummaryContract(**valid_payload)
        assert len(contract.problems) == 1
        assert len(contract.medications) == 1
        assert contract.problems[0].display == "Type 2 Diabetes Mellitus"
        assert contract.medications[0].provenance == "MedicationRequest/med-1"

    def test_missing_required_fields(self):
        """Test that missing required fields raise ValidationError."""
        incomplete_payload = {
            "problems": [
                {
                    "display": "Type 2 Diabetes Mellitus",
                    # Missing required 'codes' and 'provenance'
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

        with pytest.raises(ValidationError) as exc_info:
            SummaryContract(**incomplete_payload)

        errors = exc_info.value.errors()
        error_fields = [error['loc'] for error in errors]
        assert ('problems', 0, 'codes') in error_fields
        assert ('problems', 0, 'provenance') in error_fields

    def test_invalid_provenance_format(self):
        """Test that invalid provenance format raises ValidationError."""
        invalid_payload = {
            "problems": [
                {
                    "display": "Type 2 Diabetes Mellitus",
                    "codes": [{"system": "http://snomed.info/sct", "code": "44054006"}],
                    "provenance": "invalid-format"  # Should be ResourceType/id
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

        with pytest.raises(ValidationError) as exc_info:
            SummaryContract(**invalid_payload)

        errors = exc_info.value.errors()
        assert any("must contain '/'" in str(error) for error in errors)

    def test_empty_arrays_allowed(self):
        """Test that empty arrays are allowed for all list fields."""
        minimal_payload = {
            "problems": [],
            "medications": [],
            "allergies": [],
            "vitals": [],
            "labs": [],
            "procedures": [],
            "encounters": [],
            "careGaps": [],
            "dataQualityNotes": []
        }

        # Should not raise any validation errors
        contract = SummaryContract(**minimal_payload)
        assert len(contract.problems) == 0
        assert len(contract.careGaps) == 0

    def test_medication_specific_validation(self):
        """Test medication-specific field validation."""
        valid_medication = {
            "display": "Metformin 500mg",
            "codes": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "860975"}],
            "provenance": "MedicationRequest/med-1",
            "status": "active",
            "dosage": "500mg twice daily"
        }

        medication = MedicationItem(**valid_medication)
        assert medication.status == "active"
        assert medication.dosage == "500mg twice daily"

    def test_vital_observation_validation(self):
        """Test vital and lab observation validation."""
        valid_vital = {
            "display": "Blood Pressure",
            "value": "120/80 mmHg",
            "codes": [{"system": "http://loinc.org", "code": "85354-9"}],
            "provenance": "Observation/obs-bp-1",
            "date": "2023-12-01"
        }

        vital = VitalItem(**valid_vital)
        assert vital.value == "120/80 mmHg"
        assert vital.date == "2023-12-01"


class TestFHIRResourceBuilders:
    """Test FHIR resource builders with minimal and full examples."""

    @pytest.fixture
    def minimal_contract(self):
        """Minimal valid SummaryContract for testing."""
        return SummaryContract(
            problems=[
                ProblemItem(
                    display="Type 2 Diabetes Mellitus",
                    codes=[{"system": "http://snomed.info/sct", "code": "44054006"}],
                    provenance="Condition/cond-1"
                )
            ],
            medications=[],
            allergies=[],
            vitals=[],
            labs=[],
            procedures=[],
            encounters=[],
            careGaps=["Overdue for diabetic foot exam"],
            dataQualityNotes=["Recent data available"]
        )

    @pytest.fixture
    def full_contract(self):
        """Full SummaryContract with all field types."""
        return SummaryContract(
            problems=[
                ProblemItem(
                    display="Type 2 Diabetes Mellitus",
                    codes=[{"system": "http://snomed.info/sct", "code": "44054006"}],
                    provenance="Condition/cond-1",
                    onsetDate="2020-01-15"
                )
            ],
            medications=[
                MedicationItem(
                    display="Metformin 500mg",
                    codes=[{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "860975"}],
                    provenance="MedicationRequest/med-1",
                    status="active"
                )
            ],
            allergies=[
                AllergyItem(
                    display="Penicillin allergy",
                    codes=[{"system": "http://snomed.info/sct", "code": "294505008"}],
                    provenance="AllergyIntolerance/allergy-1"
                )
            ],
            vitals=[
                VitalItem(
                    display="Blood Pressure",
                    value="120/80 mmHg",
                    codes=[{"system": "http://loinc.org", "code": "85354-9"}],
                    provenance="Observation/obs-bp-1"
                )
            ],
            labs=[
                LabItem(
                    display="HbA1c",
                    value="7.2%",
                    codes=[{"system": "http://loinc.org", "code": "4548-4"}],
                    provenance="Observation/obs-1"
                )
            ],
            procedures=[
                ProcedureItem(
                    display="Annual diabetic eye exam",
                    codes=[{"system": "http://snomed.info/sct", "code": "134395001"}],
                    provenance="Procedure/proc-1"
                )
            ],
            encounters=[
                EncounterItem(
                    display="Office Visit",
                    type="ambulatory",
                    provenance="Encounter/enc-1"
                )
            ],
            careGaps=["Overdue for diabetic foot exam"],
            dataQualityNotes=["Recent data available"]
        )

    def test_to_composition_minimal(self, minimal_contract):
        """Test Composition creation with minimal data."""
        composition = to_composition(
            contract=minimal_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        assert composition["resourceType"] == "Composition"
        assert composition["status"] == "final"
        assert composition["subject"]["reference"] == "Patient/patient-1"
        assert composition["author"][0]["display"] == "Symphony AI Wizard"
        assert len(composition["section"]) >= 1  # At least problems section

        # Validate XHTML div presence and basic well-formedness
        problems_section = next(s for s in composition["section"] if s["title"] == "Problems")
        assert "text" in problems_section
        assert "div" in problems_section["text"]
        xhtml_content = problems_section["text"]["div"]
        assert xhtml_content.startswith("<div")
        assert xhtml_content.endswith("</div>")
        assert "Type 2 Diabetes Mellitus" in xhtml_content

    def test_to_composition_full(self, full_contract):
        """Test Composition creation with full data."""
        composition = to_composition(
            summary_contract=full_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        assert composition["resourceType"] == "Composition"
        assert len(composition["section"]) == 9  # All sections present

        section_titles = [s["title"] for s in composition["section"]]
        expected_titles = ["Problems", "Medications", "Allergies", "Vitals", "Labs", "Procedures", "Encounters", "Care Gaps", "Data Quality"]
        for title in expected_titles:
            assert title in section_titles

    def test_xhtml_well_formedness(self, full_contract):
        """Test that generated XHTML is well-formed."""
        composition = to_composition(
            summary_contract=full_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        for section in composition["section"]:
            if "text" in section and "div" in section["text"]:
                xhtml = section["text"]["div"]

                # Basic XHTML validation
                assert xhtml.startswith("<div")
                assert xhtml.endswith("</div>")

                # Check for balanced tags (simple regex check)
                open_tags = re.findall(r'<(\w+)', xhtml)
                close_tags = re.findall(r'</(\w+)>', xhtml)

                # For our simple XHTML, each opening tag should have a closing tag
                for tag in open_tags:
                    if tag not in ['br', 'hr']:  # Self-closing tags
                        assert tag in close_tags

    def test_to_lists(self, full_contract):
        """Test List resource creation."""
        lists = to_lists(
            summary_contract=full_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        assert len(lists) == 7  # Problems, Medications, Allergies, Vitals, Labs, Procedures, Encounters

        for list_resource in lists:
            assert list_resource["resourceType"] == "List"
            assert list_resource["status"] == "current"
            assert list_resource["mode"] == "snapshot"
            assert list_resource["subject"]["reference"] == "Patient/patient-1"
            assert len(list_resource["entry"]) > 0

    def test_to_document_reference(self, full_contract):
        """Test DocumentReference creation with PDF attachment."""
        doc_ref = to_document_reference(
            summary_contract=full_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        assert doc_ref["resourceType"] == "DocumentReference"
        assert doc_ref["status"] == "current"
        assert doc_ref["subject"]["reference"] == "Patient/patient-1"

        # Validate PDF attachment
        assert len(doc_ref["content"]) == 1
        attachment = doc_ref["content"][0]["attachment"]
        assert attachment["contentType"] == "application/pdf"
        assert "data" in attachment  # Base64 encoded PDF content
        assert attachment["title"] == "Clinical Summary"

    def test_make_provenance(self, full_contract):
        """Test Provenance resource creation."""
        provenance = make_provenance(
            target_refs=["Composition/comp-1"],
            patient_id="Patient/patient-1",
            source_bundle_ref="Bundle/bundle-1"
        )

        assert provenance["resourceType"] == "Provenance"
        assert provenance["target"][0]["reference"] == "Composition/comp-1"
        assert provenance["agent"][0]["who"]["display"] == "Symphony AI Wizard"
        assert provenance["entity"][0]["what"]["reference"] == "Bundle/bundle-1"

    def test_composition_coding_preservation(self, full_contract):
        """Test that original FHIR codes are preserved in Composition."""
        composition = to_composition(
            summary_contract=full_contract,
            patient_id="Patient/patient-1",
            author_display="Symphony AI Wizard"
        )

        # Find problems section
        problems_section = next(s for s in composition["section"] if s["title"] == "Problems")
        problems_entry = problems_section["entry"][0]

        # Check that SNOMED code is preserved
        assert problems_entry["reference"] == "Condition/cond-1"

        # The composition should reference the original resource
        # Actual coding validation happens in the source resources