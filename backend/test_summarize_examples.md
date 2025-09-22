# Testing the Summarize API

## Prerequisites
1. All services running:
```bash
cd docker
docker compose up --build
```

2. Patient data ingested into HAPI (use ingest API first)
3. Environment variables configured in .env:
```bash
MODEL_PROVIDER=mock  # or anthropic, openai, gemini
ANTHROPIC_API_KEY=your_key_here  # if using anthropic
OPENAI_API_KEY=your_key_here     # if using openai
GOOGLE_API_KEY=your_key_here     # if using gemini
```

## API Endpoints

### Get Summary Schema
```bash
curl -X GET http://localhost:8000/api/summarize/schema
```

### Generate Summary

#### Example 1: Basic Summary
```bash
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "patientRef": "Patient/592912",
    "useCase": "clinical_summary",
    "detailLevel": "standard",
    "codingVerbosity": "minimal",
    "temperature": 0.0
  }'
```

#### Example 2: Detailed Discharge Summary
```bash
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "localId": "592912",
    "useCase": "discharge_summary",
    "method": "comprehensive",
    "detailLevel": "detailed",
    "codingVerbosity": "full",
    "model": "anthropic",
    "temperature": 0.2
  }'
```

#### Example 3: Minimal Summary for Patient Portal
```bash
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "patientRef": "Patient/123",
    "useCase": "patient_portal",
    "detailLevel": "minimal",
    "codingVerbosity": "none",
    "temperature": 0.1
  }'
```

## Expected Response Format

### Successful Response (200 OK)
```json
{
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
      "onsetDate": null,
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
```

### Error Responses

#### Patient Not Found (404)
```json
{
  "detail": "Patient 999999 not found"
}
```

#### LLM Validation Error (422)
```json
{
  "detail": {
    "message": "Failed to generate valid summary",
    "errors": [
      "problems.0.provenance: Provenance must be in format 'ResourceType/id'"
    ]
  }
}
```

#### Invalid Request (400)
```json
{
  "detail": [
    {
      "loc": ["body", "detailLevel"],
      "msg": "detailLevel must be minimal, standard, or detailed",
      "type": "value_error"
    }
  ]
}
```

## Testing Different Use Cases

### Clinical Summary
Focus on active problems, current medications, recent vitals/labs.

### Discharge Summary
Emphasize hospital course, discharge medications, follow-up instructions.

### Referral Summary
Highlight relevant history and current concerns for specialist review.

### Patient Portal Summary
Use plain language, avoid excessive medical terminology.

## Python Test Script

```python
import requests
import json
import os

def test_summarize_endpoint():
    """Test the summarize endpoint with mock LLM."""

    # Set mock provider to avoid needing real API keys
    os.environ["MODEL_PROVIDER"] = "mock"

    base_url = "http://localhost:8000"

    # First, ensure we have a patient (you may need to ingest data first)
    payload = {
        "patientRef": "Patient/592912",
        "useCase": "clinical_summary",
        "detailLevel": "standard",
        "codingVerbosity": "minimal",
        "temperature": 0.0
    }

    response = requests.post(f"{base_url}/api/summarize", json=payload)

    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        summary = response.json()
        print(f"Generated summary with:")
        print(f"  - {len(summary['problems'])} problems")
        print(f"  - {len(summary['medications'])} medications")
        print(f"  - {len(summary['allergies'])} allergies")
        print(f"  - {len(summary['vitals'])} vitals")
        print(f"  - {len(summary['labs'])} labs")
        print(f"  - {len(summary['procedures'])} procedures")
        print(f"  - {len(summary['encounters'])} encounters")
        print(f"  - {len(summary['careGaps'])} care gaps")
        print(f"  - {len(summary['dataQualityNotes'])} data quality notes")
    else:
        print(f"Error: {response.text}")

    return response

if __name__ == "__main__":
    test_summarize_endpoint()
```

## Running Tests

```bash
# Unit tests
cd backend
pytest ../tests/test_contracts.py::TestSummaryContracts -v

# Integration test (requires services running)
python test_summarize_examples.py
```