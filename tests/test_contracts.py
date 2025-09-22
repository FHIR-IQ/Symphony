"""Contract tests for Symphony API endpoints."""

import pytest
import httpx
from typing import Dict, Any
from unittest.mock import Mock, patch, AsyncMock
import json


class TestAPIContracts:
    """Test API contract compliance."""

    base_url = "http://localhost:8000"

    @pytest.fixture
    def client(self):
        """Create test client."""
        return httpx.Client(base_url=self.base_url)

    def test_health_endpoint_contract(self, client):
        """Test /api/health endpoint returns expected schema."""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()

        # Verify response schema
        assert "status" in data
        assert data["status"] == "ok"
        assert isinstance(data["status"], str)

    def test_health_endpoint_headers(self, client):
        """Test /api/health endpoint returns proper headers."""
        response = client.get("/api/health")

        assert "content-type" in response.headers
        assert "application/json" in response.headers["content-type"]

    @pytest.mark.parametrize("endpoint", [
        "/api/health",
        "/"
    ])
    def test_cors_headers(self, client, endpoint):
        """Test CORS headers are properly set."""
        response = client.options(endpoint, headers={"Origin": "http://localhost:3000"})

        # Check for CORS headers when needed
        if response.status_code == 200:
            headers = response.headers
            assert any(h in headers for h in ["access-control-allow-origin", "Access-Control-Allow-Origin"])


class TestFHIRContracts:
    """Test FHIR transaction bundle contracts."""

    def test_transaction_bundle_structure(self):
        """Test that transaction bundle follows FHIR R4 spec."""
        bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": [
                {
                    "resource": {
                        "resourceType": "Patient",
                        "id": "123",
                        "name": [{"family": "Test", "given": ["Patient"]}]
                    },
                    "request": {
                        "method": "PUT",
                        "url": "Patient/123"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "id": "obs-1",
                        "status": "final",
                        "code": {"text": "Test"}
                    },
                    "request": {
                        "method": "PUT",
                        "url": "Observation/obs-1"
                    }
                }
            ]
        }

        # Validate bundle structure
        assert bundle["resourceType"] == "Bundle"
        assert bundle["type"] in ["transaction", "batch"]
        assert "entry" in bundle
        assert isinstance(bundle["entry"], list)

        # Validate each entry
        for entry in bundle["entry"]:
            assert "resource" in entry
            assert "request" in entry
            assert "method" in entry["request"]
            assert "url" in entry["request"]
            assert entry["request"]["method"] in ["GET", "POST", "PUT", "DELETE", "PATCH"]

    def test_minimal_resource_fields(self):
        """Test that resources have minimal required fields."""
        resources = [
            {"resourceType": "Patient", "id": "123"},
            {"resourceType": "Observation", "id": "obs-1", "status": "final", "code": {}},
            {"resourceType": "Encounter", "id": "enc-1", "status": "finished", "class": {}},
            {"resourceType": "Condition", "id": "cond-1", "clinicalStatus": {}, "subject": {}}
        ]

        for resource in resources:
            # All resources must have resourceType
            assert "resourceType" in resource
            assert resource["resourceType"]

            # Most resources should have an id
            assert "id" in resource or resource.get("resourceType") == "Bundle"

    def test_patient_reference_consistency(self):
        """Test that patient references are consistent across resources."""
        patient_id = "patient-123"
        patient_ref = f"Patient/{patient_id}"

        resources = [
            {
                "resourceType": "Patient",
                "id": patient_id
            },
            {
                "resourceType": "Observation",
                "id": "obs-1",
                "subject": {"reference": patient_ref}
            },
            {
                "resourceType": "Condition",
                "id": "cond-1",
                "subject": {"reference": patient_ref}
            }
        ]

        # Check patient reference consistency
        for resource in resources[1:]:  # Skip Patient resource
            if "subject" in resource:
                assert resource["subject"]["reference"] == patient_ref

    @pytest.mark.asyncio
    async def test_ingest_creates_valid_bundle(self):
        """Test that ingest endpoint creates valid transaction bundle."""
        from backend.app.routers.ingest import create_bundle_entry, ensure_patient_first

        # Test bundle entry creation
        resource = {
            "resourceType": "Patient",
            "id": "123",
            "name": [{"family": "Test"}]
        }

        entry = create_bundle_entry(resource, "PUT")

        assert "resource" in entry
        assert "request" in entry
        assert entry["request"]["method"] == "PUT"
        assert entry["request"]["url"] == "Patient/123"
        assert entry["resource"] == resource

        # Test patient ordering
        entries = [
            {"resource": {"resourceType": "Observation"}},
            {"resource": {"resourceType": "Patient"}},
            {"resource": {"resourceType": "Condition"}}
        ]

        ordered = ensure_patient_first(entries)
        assert ordered[0]["resource"]["resourceType"] == "Patient"

    @pytest.mark.asyncio
    async def test_mock_hapi_transaction_201(self):
        """Mock test simulating HAPI returning 201 Created for transaction."""
        from backend.app.adapters.fhir_client import HapiFHIRClient

        client = HapiFHIRClient("http://test-hapi:8080/fhir")

        mock_bundle_response = {
            "resourceType": "Bundle",
            "id": "bundle-123",
            "type": "transaction-response",
            "entry": [
                {
                    "response": {
                        "status": "201 Created",
                        "location": "Patient/123/_history/1"
                    }
                }
            ]
        }

        with patch('httpx.AsyncClient.post', new_callable=AsyncMock) as mock_post:
            mock_response = Mock()
            mock_response.status_code = 201
            mock_response.json.return_value = mock_bundle_response
            mock_response.raise_for_status.return_value = None
            mock_post.return_value = mock_response

            bundle = {
                "resourceType": "Bundle",
                "type": "transaction",
                "entry": [
                    {
                        "resource": {"resourceType": "Patient", "id": "123"},
                        "request": {"method": "PUT", "url": "Patient/123"}
                    }
                ]
            }

            response = await client.transaction(bundle)

            # Verify mock was called correctly
            mock_post.assert_called_once()
            call_args = mock_post.call_args

            # Check headers
            assert call_args.kwargs["headers"]["Content-Type"] == "application/fhir+json"
            assert call_args.kwargs["headers"]["Accept"] == "application/fhir+json"

            # Check response
            assert response["resourceType"] == "Bundle"
            assert response["type"] == "transaction-response"
            assert response["id"] == "bundle-123"

    def test_content_type_headers(self):
        """Test that FHIR content-type headers are set correctly."""
        from backend.app.adapters.fhir_client import BaseFHIRClient

        client = BaseFHIRClient("http://test-server")

        assert client.headers["Content-Type"] == "application/fhir+json"
        assert client.headers["Accept"] == "application/fhir+json"


class TestSummaryContracts:
    """Test summary contract validation and LLM retry logic."""

    def test_summary_contract_validation(self):
        """Test that SummaryContract validates required fields."""
        from backend.app.schemas.summary_contract import SummaryContract, Item, MedicationItem
        from pydantic import ValidationError

        # Valid contract
        valid_data = {
            "problems": [
                {
                    "display": "Diabetes",
                    "codes": [{"system": "http://snomed.info/sct", "code": "123"}],
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
        }

        summary = SummaryContract(**valid_data)
        assert len(summary.problems) == 1
        assert summary.problems[0].display == "Diabetes"

        # Invalid provenance format
        invalid_data = valid_data.copy()
        invalid_data["problems"][0]["provenance"] = "invalid-format"

        with pytest.raises(ValidationError) as exc:
            SummaryContract(**invalid_data)
        assert "provenance" in str(exc.value)

        # Missing required field
        missing_field_data = valid_data.copy()
        del missing_field_data["problems"][0]["display"]

        with pytest.raises(ValidationError) as exc:
            SummaryContract(**missing_field_data)
        assert "display" in str(exc.value)

    def test_schema_enforces_provenance_format(self):
        """Test that provenance must be ResourceType/id format."""
        from backend.app.schemas.summary_contract import Item
        from pydantic import ValidationError

        # Valid provenance
        item = Item(
            display="Test",
            codes=[],
            provenance="Condition/123"
        )
        assert item.provenance == "Condition/123"

        # Invalid provenance formats
        invalid_formats = [
            "",
            "NoSlash",
            "/OnlySlash",
            "Multiple/Slash/Format",
            "Condition/"
        ]

        for invalid in invalid_formats:
            with pytest.raises(ValidationError):
                Item(display="Test", codes=[], provenance=invalid)

    @pytest.mark.asyncio
    async def test_llm_retry_on_validation_failure(self):
        """Test that LLM adapter retries on validation failure."""
        from backend.app.adapters.llm_base import LLMAdapter
        from backend.app.schemas.summary_contract import SummaryValidationError
        import json

        class TestAdapter(LLMAdapter):
            def __init__(self):
                super().__init__()
                self.call_count = 0

            async def _call_model(self, prompt, temperature, max_tokens, json_mode):
                self.call_count += 1

                if self.call_count == 1:
                    # First call: return invalid JSON (missing provenance)
                    return json.dumps({
                        "problems": [{"display": "Test", "codes": []}],
                        "medications": [],
                        "allergies": [],
                        "vitals": [],
                        "labs": [],
                        "procedures": [],
                        "encounters": [],
                        "careGaps": [],
                        "dataQualityNotes": []
                    })
                else:
                    # Second call: return valid JSON
                    return json.dumps({
                        "problems": [
                            {
                                "display": "Test",
                                "codes": [],
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

        adapter = TestAdapter()
        input_bundle = {"patient": {"id": "123"}}

        summary = await adapter.generate_summary(input_bundle, {})

        # Should have retried once
        assert adapter.call_count == 2
        assert len(summary.problems) == 1
        assert summary.problems[0].provenance == "Condition/123"

    def test_no_api_keys_logged(self):
        """Ensure API keys are never logged."""
        import logging
        from io import StringIO
        import os

        # Set up capture of log output
        log_capture = StringIO()
        handler = logging.StreamHandler(log_capture)
        logger = logging.getLogger("backend.app")
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)

        # Set fake API keys
        test_keys = {
            "ANTHROPIC_API_KEY": "sk-ant-test-key-12345",
            "OPENAI_API_KEY": "sk-openai-test-key-67890",
            "GOOGLE_API_KEY": "AIza-google-test-key-abcde"
        }

        for key, value in test_keys.items():
            os.environ[key] = value

        try:
            # Try to initialize adapters (will fail, but should not log keys)
            from backend.app.adapters.llm_anthropic import AnthropicAdapter
            try:
                adapter = AnthropicAdapter()
            except:
                pass

            # Check logs don't contain keys
            log_contents = log_capture.getvalue()
            for key_value in test_keys.values():
                assert key_value not in log_contents, f"API key {key_value[:10]}... found in logs!"

        finally:
            # Clean up
            for key in test_keys:
                os.environ.pop(key, None)
            logger.removeHandler(handler)

    def test_model_provider_switching(self):
        """Test that MODEL_PROVIDER env var switches adapters."""
        import os
        from backend.app.routers.summarize import get_llm_adapter
        from backend.app.adapters.llm_base import MockLLMAdapter

        # Default to mock
        os.environ.pop("MODEL_PROVIDER", None)
        adapter = get_llm_adapter()
        assert isinstance(adapter, MockLLMAdapter)

        # Set to mock explicitly
        os.environ["MODEL_PROVIDER"] = "mock"
        adapter = get_llm_adapter()
        assert isinstance(adapter, MockLLMAdapter)

        # Override via parameter
        adapter = get_llm_adapter("mock")
        assert isinstance(adapter, MockLLMAdapter)


class TestMaterializationContracts:
    """Test FHIR resource structure validation for materialized summaries."""

    def test_composition_structure(self):
        """Test Composition resource structure."""
        from backend.app.schemas.summary_contract import SummaryContract, Item
        from backend.app.services.materialize import to_composition

        # Create test contract
        contract = SummaryContract(
            problems=[
                Item(display="Diabetes", codes=[], provenance="Condition/123")
            ],
            medications=[],
            allergies=[],
            vitals=[],
            labs=[],
            procedures=[],
            encounters=[],
            careGaps=["Missing eye exam"],
            dataQualityNotes=["Limited data before 2020"]
        )

        composition = to_composition(contract, "patient-123", "Test Author")

        # Validate required fields
        assert composition["resourceType"] == "Composition"
        assert composition["status"] == "final"
        assert "text" in composition
        assert "div" in composition["text"]
        assert composition["text"]["status"] == "generated"
        assert "subject" in composition
        assert composition["subject"]["reference"] == "Patient/patient-123"
        assert "author" in composition
        assert composition["author"][0]["display"] == "Test Author"
        assert "date" in composition
        assert "title" in composition
        assert "section" in composition

        # Validate sections
        sections = composition["section"]
        assert len(sections) > 0

        # Check for Problems section
        problems_section = next((s for s in sections if s["title"] == "Problems"), None)
        assert problems_section is not None
        assert "text" in problems_section
        assert "div" in problems_section["text"]

        # Check for Care Gaps section
        care_gaps_section = next((s for s in sections if s["title"] == "Care Gaps"), None)
        assert care_gaps_section is not None

    def test_list_structure(self):
        """Test List resource structure."""
        from backend.app.schemas.summary_contract import SummaryContract, Item
        from backend.app.services.materialize import to_lists

        # Create test contract
        contract = SummaryContract(
            problems=[
                Item(display="Diabetes", codes=[], provenance="Condition/123"),
                Item(display="Hypertension", codes=[], provenance="Condition/456")
            ],
            medications=[],
            allergies=[],
            vitals=[],
            labs=[],
            procedures=[],
            encounters=[],
            careGaps=[],
            dataQualityNotes=[]
        )

        lists = to_lists(contract, "patient-123", "Test Author")

        # Should have at least one list (Problems)
        assert len(lists) >= 1

        problem_list = lists[0]
        assert problem_list["resourceType"] == "List"
        assert problem_list["status"] == "current"
        assert problem_list["mode"] == "snapshot"
        assert problem_list["title"] == "Problem List"
        assert problem_list["subject"]["reference"] == "Patient/patient-123"
        assert problem_list["source"]["display"] == "Test Author"
        assert "date" in problem_list
        assert "entry" in problem_list
        assert len(problem_list["entry"]) == 2

        # Validate entries
        for entry in problem_list["entry"]:
            assert "item" in entry
            assert "reference" in entry["item"]
            assert entry["item"]["reference"].startswith("Condition/")

    def test_document_reference_structure(self):
        """Test DocumentReference resource structure."""
        from backend.app.schemas.summary_contract import SummaryContract
        from backend.app.services.materialize import to_document_reference

        # Create test contract
        contract = SummaryContract(
            problems=[],
            medications=[],
            allergies=[],
            vitals=[],
            labs=[],
            procedures=[],
            encounters=[],
            careGaps=["Missing screening"],
            dataQualityNotes=["Good data quality"]
        )

        doc_ref = to_document_reference(
            contract,
            "patient-123",
            "Test Author",
            tags=["ai-generated", "clinical-summary"]
        )

        # Validate required fields
        assert doc_ref["resourceType"] == "DocumentReference"
        assert doc_ref["status"] == "current"
        assert "type" in doc_ref
        assert doc_ref["type"]["text"] == "AI Clinical Note"
        assert doc_ref["subject"]["reference"] == "Patient/patient-123"
        assert "author" in doc_ref
        assert doc_ref["author"][0]["display"] == "Test Author"
        assert "date" in doc_ref
        assert "content" in doc_ref

        # Validate content attachments
        content = doc_ref["content"]
        assert len(content) == 2  # markdown and PDF

        # Check markdown attachment
        markdown_attachment = content[0]
        assert markdown_attachment["attachment"]["contentType"] == "text/markdown"
        assert "data" in markdown_attachment["attachment"]

        # Check PDF attachment
        pdf_attachment = content[1]
        assert pdf_attachment["attachment"]["contentType"] == "application/pdf"
        assert "data" in pdf_attachment["attachment"]

        # Validate categories/tags
        assert "category" in doc_ref
        categories = doc_ref["category"]
        assert len(categories) >= 2  # AI tags + default category

        # Check for AI tags
        ai_tag_category = next((c for c in categories
                               if any(coding["system"] == "http://example.org/ai-tags"
                                     for coding in c["coding"])), None)
        assert ai_tag_category is not None

    def test_provenance_structure(self):
        """Test Provenance resource structure."""
        from backend.app.services.materialize import make_provenance

        target_refs = ["Composition/123", "List/456", "DocumentReference/789"]
        source_bundle_ref = "Bundle/source-123"

        provenance = make_provenance(target_refs, source_bundle_ref, "Test Author")

        # Validate required fields
        assert provenance["resourceType"] == "Provenance"
        assert "target" in provenance
        assert len(provenance["target"]) == 3
        assert all("reference" in target for target in provenance["target"])
        assert provenance["target"][0]["reference"] == "Composition/123"

        assert "occurredDateTime" in provenance
        assert "recorded" in provenance
        assert "activity" in provenance
        assert "agent" in provenance

        # Validate activity
        activity = provenance["activity"]
        assert "coding" in activity
        assert activity["coding"][0]["code"] == "DERIVE"

        # Validate agent
        agent = provenance["agent"][0]
        assert "type" in agent
        assert "who" in agent
        assert agent["who"]["display"] == "Test Author"

        # Validate entity (source)
        assert "entity" in provenance
        entity = provenance["entity"][0]
        assert entity["role"] == "source"
        assert entity["what"]["reference"] == source_bundle_ref

    def test_patient_references_not_null(self):
        """Ensure patient references use Patient/{id} format."""
        from backend.app.schemas.summary_contract import SummaryContract
        from backend.app.services.materialize import to_composition, to_lists, to_document_reference

        # Create test contract
        contract = SummaryContract(
            problems=[],
            medications=[],
            allergies=[],
            vitals=[],
            labs=[],
            procedures=[],
            encounters=[],
            careGaps=[],
            dataQualityNotes=[]
        )

        patient_id = "test-patient-123"

        # Test composition
        composition = to_composition(contract, patient_id)
        assert composition["subject"]["reference"] == f"Patient/{patient_id}"

        # Test lists
        lists = to_lists(contract, patient_id)
        for list_resource in lists:
            assert list_resource["subject"]["reference"] == f"Patient/{patient_id}"

        # Test document reference
        doc_ref = to_document_reference(contract, patient_id)
        assert doc_ref["subject"]["reference"] == f"Patient/{patient_id}"

    def test_xhtml_minimal_div_present(self):
        """Validate XHTML minimal div in Composition.text.div."""
        from backend.app.schemas.summary_contract import SummaryContract, Item
        from backend.app.services.materialize import to_composition

        contract = SummaryContract(
            problems=[Item(display="Test Problem", codes=[], provenance="Condition/123")],
            medications=[],
            allergies=[],
            vitals=[],
            labs=[],
            procedures=[],
            encounters=[],
            careGaps=[],
            dataQualityNotes=[]
        )

        composition = to_composition(contract, "patient-123")

        # Check main narrative
        assert "text" in composition
        assert "div" in composition["text"]
        div_content = composition["text"]["div"]
        assert div_content.startswith('<div xmlns="http://www.w3.org/1999/xhtml">')
        assert div_content.endswith('</div>')

        # Check section narratives
        for section in composition["section"]:
            if "text" in section:
                assert "div" in section["text"]
                section_div = section["text"]["div"]
                assert "xmlns='http://www.w3.org/1999/xhtml'" in section_div

    def test_content_type_validation(self):
        """Ensure correct contentType for document reference attachments."""
        from backend.app.schemas.summary_contract import SummaryContract
        from backend.app.services.materialize import to_document_reference

        contract = SummaryContract(
            problems=[],
            medications=[],
            allergies=[],
            vitals=[],
            labs=[],
            procedures=[],
            encounters=[],
            careGaps=[],
            dataQualityNotes=[]
        )

        doc_ref = to_document_reference(contract, "patient-123")

        content = doc_ref["content"]

        # Check markdown content type
        markdown_content = next(c for c in content
                               if c["attachment"]["contentType"] == "text/markdown")
        assert markdown_content is not None

        # Check PDF content type
        pdf_content = next(c for c in content
                          if c["attachment"]["contentType"] == "application/pdf")
        assert pdf_content is not None
        assert "data" in pdf_content["attachment"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])