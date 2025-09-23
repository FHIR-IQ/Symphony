# Feature Specification: FHIR Materialization

## Intent
Transform validated AI-generated summaries into standard FHIR R4 resources with complete provenance tracking for interoperability and persistence.

## User Story
As a healthcare system administrator, I want AI-generated summaries to be stored as proper FHIR resources so that they integrate seamlessly with our existing health information systems.

## Acceptance Criteria

### Functional Requirements

1. **Output Methods**
   - **Composition**: Create comprehensive FHIR Composition resource
   - **Lists**: Create separate List resources for each category
   - **DocumentReference**: Create DocumentReference with PDF attachment
   - **All**: Generate all resource types simultaneously

2. **Resource Creation**
   - All resources MUST be valid FHIR R4
   - All resources MUST include proper metadata
   - All resources MUST reference source patient
   - All resources MUST include generation timestamp
   - All resources MUST have unique identifiers

3. **Provenance Tracking**
   - System MUST create Provenance resource for all generated content
   - Provenance MUST identify Symphony as agent
   - Provenance MUST reference source bundle
   - Provenance MUST include generation metadata
   - Provenance MUST track LLM provider used

4. **HAPI Server Integration**
   - System MUST POST resources to configured HAPI server
   - System MUST handle server validation responses
   - System MUST retry on transient failures
   - System MUST provide resource URLs after creation

5. **Content Formatting**
   - Human-readable XHTML narratives MUST be generated
   - Markdown MUST be converted to valid XHTML
   - PDF generation MUST preserve formatting
   - Section organization MUST be clinical-standard

## Technical Specifications

### API Contract
**Endpoint**: `POST /api/materialize`

**Request**:
```json
{
  "summaryJSON": {...},
  "method": "composition|lists|document|all",
  "metadata": {
    "authorDisplay": "Symphony AI Assistant",
    "authorReference": "Device/symphony-ai",
    "custodianReference": "Organization/symphony",
    "sourceBundleRef": "Bundle/source-bundle-id",
    "attestationMode": "professional",
    "confidentiality": "N"
  },
  "options": {
    "generatePDF": true,
    "includeSourceLinks": true,
    "addProvenanceToAll": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully created FHIR resources",
  "resources": {
    "compositionId": "Composition/uuid-123",
    "compositionUrl": "http://hapi:8080/fhir/Composition/uuid-123",
    "listIds": [
      "List/problems-uuid",
      "List/medications-uuid",
      "List/allergies-uuid"
    ],
    "documentReferenceId": "DocumentReference/uuid-456",
    "provenanceId": "Provenance/uuid-789"
  },
  "validation": {
    "status": "passed",
    "warnings": [],
    "info": ["Created 6 resources total"]
  }
}
```

### FHIR Resource Structures

#### Composition Resource
```json
{
  "resourceType": "Composition",
  "status": "final",
  "type": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "11488-4",
      "display": "Consultation note"
    }]
  },
  "subject": {"reference": "Patient/123"},
  "date": "2024-01-20",
  "author": [{"display": "Symphony AI Assistant"}],
  "title": "AI-Generated Clinical Summary",
  "section": [
    {
      "title": "Active Problems",
      "code": {...},
      "text": {"status": "generated", "div": "<div>...</div>"},
      "entry": [{"reference": "Condition/..."}]
    }
  ]
}
```

#### List Resources
```json
{
  "resourceType": "List",
  "status": "current",
  "mode": "snapshot",
  "title": "Active Medications",
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "10160-0",
      "display": "History of Medication use Narrative"
    }]
  },
  "subject": {"reference": "Patient/123"},
  "date": "2024-01-20",
  "source": {"display": "Symphony AI"},
  "entry": [
    {
      "item": {"display": "Metformin 500mg twice daily"},
      "date": "2024-01-20"
    }
  ]
}
```

#### DocumentReference Resource
```json
{
  "resourceType": "DocumentReference",
  "status": "current",
  "type": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "34133-9",
      "display": "Summary of episode note"
    }]
  },
  "subject": {"reference": "Patient/123"},
  "date": "2024-01-20",
  "author": [{"display": "Symphony AI Assistant"}],
  "content": [
    {
      "attachment": {
        "contentType": "application/pdf",
        "data": "base64-encoded-pdf",
        "title": "Clinical Summary.pdf",
        "creation": "2024-01-20"
      }
    }
  ]
}
```

#### Provenance Resource
```json
{
  "resourceType": "Provenance",
  "target": [
    {"reference": "Composition/uuid-123"}
  ],
  "recorded": "2024-01-20T10:30:00Z",
  "agent": [
    {
      "who": {"display": "Symphony AI System"},
      "onBehalfOf": {"reference": "Organization/healthcare-org"}
    }
  ],
  "entity": [
    {
      "role": "source",
      "what": {"reference": "Bundle/source-bundle-id"}
    }
  ],
  "activity": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
      "code": "CREATE",
      "display": "create"
    }]
  }
}
```

### PDF Generation
1. Convert markdown to HTML
2. Apply clinical document styling
3. Include all summary sections
4. Add metadata header
5. Generate table of contents
6. Convert to PDF with proper pagination
7. Embed as base64 in DocumentReference

### Validation Requirements
1. All resources MUST pass FHIR R4 validation
2. All references MUST resolve
3. All required fields MUST be present
4. All codings MUST use standard systems
5. All narratives MUST be valid XHTML

## Test Scenarios

### Happy Path
1. Generate valid summary
2. Select Composition method
3. Click Materialize
4. Verify resources created in HAPI
5. Access resources via provided URLs

### Method Variations
1. **Composition Only**: Single resource creation
2. **Lists Only**: Multiple list resources
3. **Document Only**: PDF generation
4. **All Methods**: Complete resource set

### Error Cases
1. **HAPI Offline**: Server unreachable
2. **Validation Error**: Invalid FHIR structure
3. **PDF Failure**: Generation error
4. **Duplicate Resource**: Already exists
5. **Permission Denied**: Authorization failure

## Implementation Notes

### Resource Building
- Use FHIR.js or similar library
- Implement builder pattern for resources
- Validate before sending to server
- Handle server-assigned IDs

### Performance Considerations
- Batch resource creation where possible
- Implement transaction bundles
- Cache generated PDFs temporarily
- Use async processing for large summaries

### Error Recovery
- Rollback on partial failure
- Provide detailed error messages
- Allow retry of failed operations
- Log all transactions

## Success Metrics
- 100% FHIR R4 validation pass rate
- Average materialization time < 5 seconds
- Support for all 4 output methods
- Zero data loss during transformation
- Complete provenance chain maintained