# Testing the Materialize API

## Prerequisites
1. All services running:
```bash
cd docker
docker compose up --build
```

2. Patient data and summary available (use ingest and summarize APIs first)

## API Endpoints

### Get Available Methods
```bash
curl -X GET http://localhost:8000/api/materialize/methods
```

### Preview Materialization (without writing to HAPI)
```bash
curl -X POST http://localhost:8000/api/materialize/preview \
  -H "Content-Type: application/json" \
  -d '{
    "summaryJSON": {
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
      "allergies": [],
      "vitals": [],
      "labs": [],
      "procedures": [],
      "encounters": [],
      "careGaps": ["Overdue for annual eye exam"],
      "dataQualityNotes": ["Limited data before 2020"]
    },
    "method": "composition",
    "authorDisplay": "Dr. Smith"
  }'
```

### Materialize Summary

#### Example 1: Create Composition
```bash
curl -X POST http://localhost:8000/api/materialize \
  -H "Content-Type: application/json" \
  -d '{
    "summaryJSON": {
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
      "allergies": [],
      "vitals": [],
      "labs": [],
      "procedures": [],
      "encounters": [],
      "careGaps": ["Overdue for annual eye exam"],
      "dataQualityNotes": ["Limited data before 2020"]
    },
    "method": "composition",
    "authorDisplay": "Dr. Smith",
    "sourceBundleRef": "Bundle/ingest-123"
  }'
```

#### Example 2: Create Lists
```bash
curl -X POST http://localhost:8000/api/materialize \
  -H "Content-Type: application/json" \
  -d '{
    "summaryJSON": {
      "problems": [
        {
          "display": "Hypertension",
          "codes": [],
          "provenance": "Condition/789"
        }
      ],
      "medications": [
        {
          "display": "Lisinopril 10mg daily",
          "codes": [],
          "status": "active",
          "provenance": "MedicationRequest/101"
        }
      ],
      "allergies": [
        {
          "display": "Penicillin allergy",
          "codes": [],
          "provenance": "AllergyIntolerance/202"
        }
      ],
      "vitals": [],
      "labs": [],
      "procedures": [],
      "encounters": [],
      "careGaps": [],
      "dataQualityNotes": []
    },
    "method": "lists",
    "authorDisplay": "Symphony AI"
  }'
```

#### Example 3: Create DocumentReference with Tags
```bash
curl -X POST http://localhost:8000/api/materialize \
  -H "Content-Type: application/json" \
  -d '{
    "summaryJSON": {
      "problems": [],
      "medications": [],
      "allergies": [],
      "vitals": [
        {
          "display": "Blood Pressure",
          "value": "130/85 mmHg",
          "codes": [],
          "date": "2024-01-15",
          "provenance": "Observation/321"
        }
      ],
      "labs": [
        {
          "display": "HbA1c",
          "value": "7.2 %",
          "codes": [],
          "date": "2024-01-10",
          "provenance": "Observation/654"
        }
      ],
      "procedures": [],
      "encounters": [],
      "careGaps": ["Missing pneumonia vaccine"],
      "dataQualityNotes": ["Recent data complete"]
    },
    "method": "document",
    "authorDisplay": "Symphony AI",
    "docRefTags": ["ai-generated", "clinical-summary", "diabetes-care"]
  }'
```

#### Example 4: Create All Resource Types
```bash
curl -X POST http://localhost:8000/api/materialize \
  -H "Content-Type: application/json" \
  -d '{
    "summaryJSON": {
      "problems": [
        {
          "display": "Type 2 Diabetes",
          "codes": [],
          "provenance": "Condition/123"
        }
      ],
      "medications": [
        {
          "display": "Metformin 500mg BID",
          "codes": [],
          "status": "active",
          "provenance": "MedicationRequest/456"
        }
      ],
      "allergies": [],
      "vitals": [],
      "labs": [],
      "procedures": [],
      "encounters": [],
      "careGaps": ["Annual eye exam overdue"],
      "dataQualityNotes": ["Data from 2020 onwards"]
    },
    "method": "all",
    "authorDisplay": "Dr. Johnson",
    "docRefTags": ["comprehensive", "annual-summary"],
    "sourceBundleRef": "Bundle/annual-review-2024"
  }'
```

#### Example 5: With Custom PDF Content
```bash
# First, create base64 encoded PDF content (or use placeholder)
echo "Custom PDF content for clinical summary" | base64

curl -X POST http://localhost:8000/api/materialize \
  -H "Content-Type: application/json" \
  -d '{
    "summaryJSON": {
      "problems": [],
      "medications": [],
      "allergies": [],
      "vitals": [],
      "labs": [],
      "procedures": [],
      "encounters": [],
      "careGaps": [],
      "dataQualityNotes": []
    },
    "method": "document",
    "authorDisplay": "Report Generator",
    "pdfBase64": "Q3VzdG9tIFBERiBjb250ZW50IGZvciBjbGluaWNhbCBzdW1tYXJ5Cg==",
    "docRefTags": ["custom-pdf", "report"]
  }'
```

## Expected Response Format

### Successful Response (201 Created)
```json
{
  "success": true,
  "message": "Successfully materialized 4 FHIR resources",
  "bundleId": "bundle-uuid-here",
  "compositionId": "composition-uuid-here",
  "listIds": ["list-1-uuid", "list-2-uuid"],
  "documentReferenceId": "doc-ref-uuid-here",
  "provenanceId": "provenance-uuid-here",
  "errors": []
}
```

### Preview Response (200 OK)
```json
{
  "preview": true,
  "bundle": {
    "resourceType": "Bundle",
    "type": "transaction",
    "entry": [
      {
        "resource": {
          "resourceType": "Composition",
          "id": "...",
          "status": "final",
          "type": {...},
          "subject": {"reference": "Patient/..."},
          "section": [...]
        },
        "request": {
          "method": "PUT",
          "url": "Composition/..."
        }
      }
    ]
  },
  "resourceCount": 2,
  "resourceTypes": ["Composition", "Provenance"]
}
```

## Verify Created Resources in HAPI

After successful materialization, verify the resources:

```bash
# Get created Composition
curl http://localhost:8080/fhir/Composition/{compositionId}

# Get created Lists
curl http://localhost:8080/fhir/List/{listId}

# Get created DocumentReference
curl http://localhost:8080/fhir/DocumentReference/{documentReferenceId}

# Get Provenance
curl http://localhost:8080/fhir/Provenance/{provenanceId}

# Search for all resources created by Symphony
curl "http://localhost:8080/fhir/Provenance?agent=Symphony%20AI"
```

## Test Resource Structure

### Composition Validation
```bash
# Get composition and verify structure
COMP_ID="your-composition-id-here"
curl http://localhost:8080/fhir/Composition/$COMP_ID | jq '{
  resourceType: .resourceType,
  status: .status,
  hasText: (.text != null),
  hasDiv: (.text.div != null),
  sectionCount: (.section | length),
  sectionTitles: [.section[].title]
}'
```

### List Validation
```bash
# Get list and verify structure
LIST_ID="your-list-id-here"
curl http://localhost:8080/fhir/List/$LIST_ID | jq '{
  resourceType: .resourceType,
  status: .status,
  mode: .mode,
  title: .title,
  entryCount: (.entry | length)
}'
```

### DocumentReference Validation
```bash
# Get document reference and verify attachments
DOC_ID="your-document-reference-id-here"
curl http://localhost:8080/fhir/DocumentReference/$DOC_ID | jq '{
  resourceType: .resourceType,
  status: .status,
  type: .type.text,
  contentCount: (.content | length),
  contentTypes: [.content[].attachment.contentType],
  hasCategories: (.category != null),
  categoryCount: (.category | length)
}'
```

## Error Handling Tests

### Invalid Summary Contract
```bash
curl -X POST http://localhost:8000/api/materialize \
  -H "Content-Type: application/json" \
  -d '{
    "summaryJSON": {
      "problems": [
        {
          "display": "Invalid Problem",
          "codes": [],
          "provenance": "invalid-format"
        }
      ]
    },
    "method": "composition"
  }'
```

### Invalid Method
```bash
curl -X POST http://localhost:8000/api/materialize \
  -H "Content-Type: application/json" \
  -d '{
    "summaryJSON": {"problems": [], "medications": []},
    "method": "invalid-method"
  }'
```

## Python Test Script

```python
import requests
import json

def test_materialize_endpoint():
    """Test the materialize endpoint."""

    base_url = "http://localhost:8000"

    # Test summary contract
    summary_json = {
        "problems": [
            {
                "display": "Test Problem",
                "codes": [{"system": "http://test.org", "code": "123"}],
                "onsetDate": "2024-01-01",
                "provenance": "Condition/test-123"
            }
        ],
        "medications": [],
        "allergies": [],
        "vitals": [],
        "labs": [],
        "procedures": [],
        "encounters": [],
        "careGaps": ["Test care gap"],
        "dataQualityNotes": ["Test data quality note"]
    }

    # Test preview first
    preview_payload = {
        "summaryJSON": summary_json,
        "method": "composition",
        "authorDisplay": "Test Author"
    }

    preview_response = requests.post(
        f"{base_url}/api/materialize/preview",
        json=preview_payload
    )

    print(f"Preview Status: {preview_response.status_code}")
    if preview_response.status_code == 200:
        preview_data = preview_response.json()
        print(f"Preview Resources: {preview_data['resourceCount']}")
        print(f"Resource Types: {preview_data['resourceTypes']}")

    # Test actual materialization
    materialize_payload = {
        "summaryJSON": summary_json,
        "method": "all",
        "authorDisplay": "Test Author",
        "docRefTags": ["test", "ai-generated"]
    }

    materialize_response = requests.post(
        f"{base_url}/api/materialize",
        json=materialize_payload
    )

    print(f"Materialize Status: {materialize_response.status_code}")
    if materialize_response.status_code == 201:
        result = materialize_response.json()
        print(f"Success: {result['success']}")
        print(f"Bundle ID: {result['bundleId']}")
        print(f"Composition ID: {result.get('compositionId')}")
        print(f"List IDs: {result.get('listIds', [])}")
        print(f"Document Reference ID: {result.get('documentReferenceId')}")
        print(f"Provenance ID: {result.get('provenanceId')}")
    else:
        print(f"Error: {materialize_response.text}")

if __name__ == "__main__":
    test_materialize_endpoint()
```

## Running Tests

```bash
# Unit tests
cd backend
pytest ../tests/test_contracts.py::TestMaterializationContracts -v

# Integration test
python test_materialize_examples.py
```