# Feature Specification: Data Ingestion

## Intent
Enable healthcare providers to retrieve and aggregate patient data from any FHIR R4-compliant server for summary generation.

## User Story
As a healthcare provider, I want to ingest patient data from various FHIR servers so that I can generate comprehensive clinical summaries.

## Acceptance Criteria

### Functional Requirements
1. **Server Connection**
   - System MUST connect to any FHIR R4 server via base URL
   - System MUST validate server connectivity before ingestion
   - System MUST handle authentication if required

2. **Patient Data Retrieval**
   - System MUST retrieve all specified resource types for a patient
   - System MUST handle patients with no data gracefully
   - System MUST aggregate resources by reference

3. **Resource Selection**
   - User MUST be able to select which resource types to ingest
   - System MUST support core clinical resources:
     - Patient demographics
     - Conditions/Problems
     - Medications/MedicationRequests
     - Observations (labs, vitals)
     - Procedures
     - AllergyIntolerances
     - Encounters
     - Immunizations

4. **Data Validation**
   - System MUST validate FHIR resources against R4 schemas
   - System MUST report validation errors clearly
   - System MUST continue ingestion despite individual resource errors

5. **Progress Tracking**
   - System MUST show real-time progress during ingestion
   - System MUST display count of resources retrieved
   - System MUST indicate completion status

## Technical Specifications

### API Contract
**Endpoint**: `POST /api/ingest`

**Request**:
```json
{
  "sourceBaseUrl": "https://fhir.server.url/baseR4",
  "patientId": "patient-123",
  "resources": ["Patient", "Condition", "Observation"],
  "includeRelated": true,
  "dateRange": {
    "start": "2023-01-01",
    "end": "2024-12-31"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully ingested patient data",
  "patientReference": "Patient/patient-123",
  "resourceCounts": {
    "Patient": 1,
    "Condition": 5,
    "Observation": 25
  },
  "bundleId": "bundle-uuid-123",
  "errors": [],
  "warnings": ["Some observations missing units"]
}
```

### Data Storage
- Ingested data MUST be stored as FHIR Bundle
- Bundle MUST include all retrieved resources
- Bundle MUST maintain resource relationships
- Bundle MUST be retrievable by ID

### Error Handling
- Connection failures MUST provide clear error messages
- Invalid patient IDs MUST be detected and reported
- Partial failures MUST not stop entire ingestion
- All errors MUST be logged with context

## Test Scenarios

### Happy Path
1. Connect to public HAPI server
2. Enter valid patient ID
3. Select all resource types
4. Click "Ingest"
5. Verify all resources retrieved and counted

### Edge Cases
1. **Empty Patient**: Patient with no clinical data
2. **Large Dataset**: Patient with 1000+ resources
3. **Slow Network**: Handle timeout gracefully
4. **Invalid Server**: Non-FHIR endpoint
5. **Missing Resources**: Some resource types not available

### Error Cases
1. **Invalid URL**: Malformed server URL
2. **Network Error**: Server unreachable
3. **Invalid Patient**: Non-existent patient ID
4. **Auth Required**: Server requires authentication
5. **Rate Limiting**: Server throttles requests

## Implementation Notes

### Performance Considerations
- Implement pagination for large datasets
- Use batch requests where supported
- Cache server metadata for repeated use
- Implement request timeout (30 seconds default)

### Security Considerations
- Validate all URLs before connection
- Use HTTPS for all connections
- Don't store sensitive auth tokens
- Log access attempts for audit

## Success Metrics
- 95% successful ingestion rate
- Average ingestion time < 10 seconds
- Support for 10+ different FHIR servers
- Handle patients with 1000+ resources