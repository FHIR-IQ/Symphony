# Symphony System Specification

## Overview
Symphony is an AI-powered medical summary generation system that transforms FHIR data into clinically useful summaries using large language models, with validation and materialization back to FHIR resources.

## System Components

### 1. Data Ingestion Service
**Purpose**: Retrieve and aggregate patient data from FHIR servers

**Specifications**:
- MUST support multiple FHIR server endpoints
- MUST handle R4 FHIR resources
- MUST aggregate resources by patient reference
- MUST provide resource counting and validation
- MUST store ingested data in bundles for processing

**Input Contract**:
```json
{
  "sourceBaseUrl": "string (valid URL)",
  "patientId": "string (FHIR patient ID)",
  "resources": ["array of FHIR resource types"]
}
```

**Output Contract**:
```json
{
  "message": "string",
  "patientReference": "string (Patient/id format)",
  "resourceCounts": {"resourceType": "count"},
  "bundleId": "string (UUID)"
}
```

### 2. Summary Generation Service
**Purpose**: Generate AI-powered clinical summaries from FHIR data

**Specifications**:
- MUST support multiple LLM providers (Anthropic, OpenAI, Google, Mock)
- MUST validate summaries against defined JSON contracts
- MUST provide configurable detail levels
- MUST support both patient and provider audiences
- MUST track generation metadata

**Summary Contract Schema**:
```json
{
  "patient_name": "string",
  "patient_dob": "string (date)",
  "patient_gender": "string",
  "summary_date": "string (datetime)",
  "problems": [{
    "condition": "string",
    "status": "string",
    "onset_date": "string (date)",
    "clinical_status": "string",
    "verification_status": "string",
    "category": "string",
    "severity": "string",
    "body_site": "string",
    "notes": "string"
  }],
  "medications": [{
    "name": "string",
    "dosage": "string",
    "frequency": "string",
    "route": "string",
    "status": "string",
    "prescriber": "string",
    "date_prescribed": "string (date)",
    "reason": "string",
    "instructions": "string"
  }],
  "allergies": [{
    "substance": "string",
    "reaction": "string",
    "severity": "string",
    "onset": "string (date)",
    "criticality": "string",
    "verification_status": "string",
    "notes": "string"
  }],
  "vitals": [{
    "date": "string (date)",
    "blood_pressure": "string",
    "heart_rate": "string",
    "temperature": "string",
    "respiratory_rate": "string",
    "oxygen_saturation": "string",
    "weight": "string",
    "height": "string",
    "bmi": "string"
  }],
  "recent_labs": [{
    "test_name": "string",
    "result": "string",
    "reference_range": "string",
    "date": "string (date)",
    "status": "string",
    "interpretation": "string",
    "performing_org": "string"
  }],
  "procedures": [{
    "name": "string",
    "date": "string (date)",
    "status": "string",
    "performer": "string",
    "location": "string",
    "reason": "string",
    "outcome": "string",
    "notes": "string"
  }],
  "encounters": [{
    "date": "string (date)",
    "type": "string",
    "provider": "string",
    "location": "string",
    "reason": "string",
    "diagnosis": "string",
    "notes": "string",
    "follow_up": "string"
  }],
  "care_gaps": [{
    "type": "string",
    "description": "string",
    "priority": "string",
    "due_date": "string (date)",
    "evidence_based_guideline": "string",
    "status": "string"
  }],
  "social_determinants": [{
    "category": "string",
    "description": "string",
    "status": "string",
    "date_identified": "string (date)",
    "interventions": "string"
  }],
  "risk_factors": [{
    "factor": "string",
    "severity": "string",
    "description": "string",
    "mitigation": "string"
  }]
}
```

### 3. Materialization Service
**Purpose**: Convert validated summaries into FHIR resources

**Specifications**:
- MUST create valid FHIR R4 resources
- MUST support multiple output methods (Composition, Lists, DocumentReference)
- MUST create Provenance resources for all generated content
- MUST persist to configured HAPI server
- MUST provide resource IDs for created resources

**Output Methods**:
1. **Composition**: Single FHIR Composition with sections
2. **Lists**: Multiple List resources by category
3. **DocumentReference**: PDF attachment with summary
4. **All**: Create all resource types

### 4. Frontend Application
**Purpose**: Provide fully functional user interface for the 5-step wizard workflow

**Specifications**:
- MUST implement 5-step wizard: Ingest → Configure → LLM Settings → Generate → Persist
- MUST provide real-time validation feedback
- MUST support export in JSON and CSV formats
- MUST display progress indicators for long operations
- MUST handle errors gracefully with user-friendly messages
- **ALL UI elements MUST be fully functional - no placeholder or non-working options**
- **Every configuration option MUST have working implementation**
- **All buttons, forms, and interactions MUST be tested and operational**
- **UI MUST be comprehensively tested for all user flows**
- **Non-functional UI elements MUST be removed or implemented**

### 5. FHIR Viewer Service
**Purpose**: Enable viewing of FHIR resources

**Specifications**:
- MUST fetch resources from HAPI server
- MUST format JSON for readability
- MUST provide both raw and formatted views
- MUST handle resource not found errors

## Integration Points

### API Endpoints
All endpoints MUST follow RESTful conventions:

1. `GET /api/health` - Health check
2. `POST /api/ingest` - Data ingestion
3. `POST /api/summarize` - Summary generation
4. `POST /api/materialize` - FHIR materialization
5. `GET /api/viewer/{resourceType}/{id}` - Resource viewer
6. `GET /api/export/{patientId}` - Export patient bundle

### External Dependencies
1. **FHIR Servers**: Any R4-compliant server
2. **LLM Providers**: Anthropic, OpenAI, Google APIs
3. **HAPI FHIR**: Local or remote instance

## Non-Functional Requirements

### Performance
- Summary generation MUST complete within 60 seconds
- Data ingestion MUST handle patients with 1000+ resources
- UI MUST provide feedback within 100ms of user action

### Reliability
- System MUST handle LLM API failures gracefully
- MUST provide mock provider for testing
- MUST validate all data transformations

### Security
- API keys MUST be stored securely in environment variables
- Patient data MUST be transmitted over HTTPS
- CORS policies MUST be properly configured

### Scalability
- MUST support horizontal scaling via Docker
- MUST handle concurrent user sessions
- MUST support batch processing for multiple patients

## Testing Requirements

### Unit Tests
- Contract validation logic
- Data transformation functions
- FHIR resource builders

### Integration Tests
- FHIR server connectivity
- LLM provider interactions
- End-to-end workflow

### Contract Tests
- Summary JSON schema validation
- FHIR resource validation
- API response contracts

## Deployment Specifications

### Docker Composition
- Web service (port 3000)
- API service (port 8000)
- HAPI service (port 8080)

### Environment Configuration
Required environment variables:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `MODEL_PROVIDER`
- `HAPI_BASE`
- `BACKEND_URL`