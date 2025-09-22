# Testing the Ingest API

## Prerequisites
Ensure all services are running:
```bash
cd docker
docker compose up --build
```

## Test Examples

### 1. Basic Health Check
```bash
curl -X GET http://localhost:8000/api/health
```

### 2. Ingest Patient Data from Source FHIR Server

#### Example: Ingest Patient with Basic Resources
```bash
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceBaseUrl": "https://hapi.fhir.org/baseR4",
    "patientId": "592912",
    "resources": ["Patient", "Observation", "Condition"]
  }'
```

#### Example: Ingest All Supported Resources
```bash
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceBaseUrl": "https://hapi.fhir.org/baseR4",
    "patientId": "592912",
    "resources": [
      "Patient",
      "Encounter",
      "Condition",
      "Observation",
      "MedicationRequest",
      "AllergyIntolerance",
      "Procedure",
      "DiagnosticReport",
      "Immunization",
      "CarePlan"
    ]
  }'
```

### 3. Test with Local HAPI Server

Once your local HAPI is populated, you can test ingestion between servers:

```bash
# First, check if HAPI is running
curl http://localhost:8080/fhir/metadata

# Create a test patient in local HAPI (optional)
curl -X POST http://localhost:8080/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "id": "test-patient-1",
    "name": [
      {
        "family": "TestFamily",
        "given": ["TestGiven"]
      }
    ],
    "birthDate": "1990-01-01"
  }'

# Ingest from public HAPI to local HAPI
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceBaseUrl": "https://hapi.fhir.org/baseR4",
    "patientId": "592912",
    "resources": ["Patient", "Observation"]
  }'
```

### 4. Error Handling Tests

#### Test with Invalid Patient ID
```bash
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceBaseUrl": "https://hapi.fhir.org/baseR4",
    "patientId": "invalid-patient-id-999999",
    "resources": ["Patient"]
  }'
```

#### Test with Invalid Source URL
```bash
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceBaseUrl": "http://invalid-fhir-server.com",
    "patientId": "123",
    "resources": ["Patient"]
  }'
```

#### Test with Invalid Resource Type
```bash
curl -X POST http://localhost:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "sourceBaseUrl": "https://hapi.fhir.org/baseR4",
    "patientId": "592912",
    "resources": ["InvalidResourceType"]
  }'
```

## Expected Response Format

### Successful Response (201 Created)
```json
{
  "success": true,
  "message": "Successfully ingested 5 resources",
  "patientReference": "Patient/592912",
  "resourceCounts": {
    "Patient": 1,
    "Observation": 3,
    "Condition": 1
  },
  "bundleId": "bundle-uuid-here",
  "errors": []
}
```

### Error Response (4xx/5xx)
```json
{
  "detail": "Patient 999999 not found at source server"
}
```

## Verify Data in Local HAPI

After successful ingestion, verify the data:

```bash
# Get the ingested patient
curl http://localhost:8080/fhir/Patient/592912

# Search for patient's observations
curl "http://localhost:8080/fhir/Observation?patient=592912"

# Get bundle transaction history
curl http://localhost:8080/fhir/_history
```

## Python Test Script

```python
import requests
import json

def test_ingest():
    url = "http://localhost:8000/api/ingest"

    payload = {
        "sourceBaseUrl": "https://hapi.fhir.org/baseR4",
        "patientId": "592912",
        "resources": ["Patient", "Observation", "Condition"]
    }

    response = requests.post(url, json=payload)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    assert response.status_code == 201
    assert response.json()["success"] == True

if __name__ == "__main__":
    test_ingest()
```