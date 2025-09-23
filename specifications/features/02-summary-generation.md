# Feature Specification: AI-Powered Summary Generation

## Intent
Generate clinically accurate, AI-powered summaries from ingested FHIR data using multiple LLM providers with strict validation.

## User Story
As a healthcare provider, I want to generate comprehensive clinical summaries using AI so that I can quickly understand a patient's medical status and history.

## Acceptance Criteria

### Functional Requirements

1. **LLM Provider Selection**
   - System MUST support multiple LLM providers:
     - Anthropic Claude (3.5 Sonnet, 3 Opus)
     - OpenAI GPT (4, 4 Turbo)
     - Google Gemini (1.5 Pro, 1.5 Flash)
     - Mock provider for testing
   - User MUST be able to switch providers without data loss
   - System MUST handle provider API failures gracefully

2. **Configuration Options**
   - **Audience**: Patient-friendly vs Provider-focused language
   - **Detail Level**: Simple, Standard, Advanced, Expert
   - **Medical Coding**: Include/exclude medical codes
   - **Temperature**: 0.0 (deterministic) to 1.0 (creative)
   - **Output Method**: Composition, Lists, DocumentReference, All

3. **Summary Generation**
   - System MUST extract relevant information from FHIR bundle
   - System MUST organize data into clinical categories
   - System MUST generate human-readable narratives
   - System MUST maintain clinical accuracy
   - System MUST complete within 60 seconds
   - **System MUST generate BOTH structured JSON AND narrative text**
   - **AI-generated narratives MUST be included for each section**
   - **Narratives MUST be contextually relevant and medically accurate**
   - **Both JSON structure AND narrative content MUST be validated**
   - **Narrative generation MUST be tested and confirmed working**

4. **Validation Requirements**
   - All summaries MUST pass JSON schema validation
   - All required fields MUST be populated
   - Dates MUST be in ISO format
   - Clinical terminology MUST be accurate
   - No patient identifiers in mock mode

5. **Summary Sections**
   - Patient demographics
   - Active problems/conditions
   - Current medications
   - Allergies and intolerances
   - Recent vital signs
   - Laboratory results
   - Procedures performed
   - Recent encounters
   - Care gaps identified
   - Social determinants
   - Risk factors

## Technical Specifications

### API Contract
**Endpoint**: `POST /api/summarize`

**Request**:
```json
{
  "patientRef": "Patient/123",
  "bundleId": "bundle-uuid",
  "configuration": {
    "useCase": "clinical_summary",
    "audience": "provider",
    "method": "composition",
    "detailLevel": "standard",
    "includeCoding": true,
    "sections": ["problems", "medications", "allergies", "vitals", "labs"]
  },
  "llmSettings": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet",
    "temperature": 0.3,
    "maxTokens": 4000
  }
}
```

**Response**:
```json
{
  "success": true,
  "summary": {
    "patient_name": "John Doe",
    "patient_dob": "1980-01-15",
    "patient_gender": "male",
    "summary_date": "2024-01-20T10:30:00Z",
    "problems": [...],
    "medications": [...],
    "allergies": [...],
    "vitals": [...],
    "recent_labs": [...],
    "procedures": [...],
    "encounters": [...],
    "care_gaps": [...],
    "social_determinants": [...],
    "risk_factors": [...]
  },
  "metadata": {
    "generatedBy": "claude-3-5-sonnet",
    "generationTime": 15.3,
    "tokenCount": 2500,
    "validationStatus": "passed",
    "warnings": []
  }
}
```

### Validation Schema
Each section must conform to defined JSON schemas:

**Problem Schema**:
```json
{
  "condition": "string (required)",
  "status": "active|resolved|inactive",
  "onset_date": "ISO date string",
  "clinical_status": "string",
  "verification_status": "confirmed|provisional|differential",
  "category": "string",
  "severity": "mild|moderate|severe",
  "body_site": "string",
  "notes": "string"
}
```

### LLM Prompting Strategy

1. **System Prompt**: Define role as clinical data analyst
2. **Context**: Provide FHIR bundle data
3. **Instructions**: Specify output format and requirements
4. **Validation**: Request structured JSON output
5. **Safety**: Include medical accuracy requirements

### Error Handling

1. **LLM Failures**
   - Retry with exponential backoff (3 attempts)
   - Fall back to mock provider if configured
   - Return partial summary if possible
   - Log all errors with context

2. **Validation Failures**
   - Return specific field errors
   - Highlight missing required data
   - Provide correction suggestions
   - Allow manual override with warnings

## Test Scenarios

### Happy Path
1. Select Anthropic Claude provider
2. Configure for provider audience, standard detail
3. Generate summary from ingested data
4. Verify all sections populated
5. Confirm validation passes

### Edge Cases
1. **Minimal Data**: Patient with only demographics
2. **Complex Patient**: 100+ conditions and medications
3. **Historical Data**: 10+ years of records
4. **Multiple Languages**: Non-English content
5. **Incomplete Records**: Missing key information

### Error Cases
1. **API Key Invalid**: Provider authentication fails
2. **Rate Limited**: Provider throttles requests
3. **Timeout**: Generation exceeds 60 seconds
4. **Invalid Response**: LLM returns malformed JSON
5. **Validation Failure**: Missing required fields

## Implementation Notes

### Performance Optimization
- Cache provider connections
- Stream responses where supported
- Implement request batching
- Use async processing for long operations

### Quality Assurance
- Implement medical terminology validation
- Cross-reference with FHIR ValueSets
- Validate drug names against RxNorm
- Check date consistency

### Prompt Engineering
- Use few-shot examples for consistency
- Include medical context in prompts
- Specify output structure explicitly
- Request reasoning for care gaps

## Success Metrics
- 99% validation success rate
- Average generation time < 20 seconds
- Support for 3+ LLM providers
- 95% clinical accuracy (verified by providers)
- Zero patient data leaks in mock mode