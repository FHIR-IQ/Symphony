# Symphony System Design

## Architecture Overview

Symphony follows a microservices architecture with clear separation of concerns and spec-driven development principles.

```
┌──────────────────────────────────────────────────────────────┐
│                        User Interface                         │
│                      (Next.js Frontend)                       │
└─────────────────────┬────────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼────────────────────────────────────────┐
│                      API Gateway                              │
│                    (FastAPI Backend)                          │
├───────────────┬──────────────┬──────────────┬───────────────┤
│   Ingestion   │   Summary    │ Materialization│   Export    │
│   Service     │   Service    │    Service     │   Service   │
└───────┬───────┴──────┬───────┴────────┬──────┴───────┬──────┘
        │              │                 │              │
┌───────▼───────┐ ┌────▼────┐ ┌─────────▼────────┐ ┌──▼──────┐
│  FHIR Client  │ │LLM      │ │  FHIR Builder    │ │ Export  │
│               │ │Providers│ │                  │ │ Engine  │
└───────┬───────┘ └─────────┘ └─────────┬────────┘ └─────────┘
        │                                │
┌───────▼────────────────────────────────▼────────────────────┐
│                     HAPI FHIR Server                         │
│                    (Data Persistence)                        │
└──────────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Frontend Application
**Technology**: Next.js 14, React, TypeScript, Tailwind CSS

**Responsibilities**:
- 5-step wizard UI implementation
- Form validation and user feedback
- API communication
- Export functionality
- Real-time progress tracking

**Key Components**:
```typescript
interface WizardStep {
  id: string;
  title: string;
  component: React.FC<StepProps>;
  validation: () => boolean;
  onComplete: () => Promise<void>;
}

interface AppState {
  currentStep: number;
  patientData: FHIRBundle;
  configuration: SummaryConfig;
  summary: SummaryContract;
  materializationResult: MaterializationResponse;
}
```

### 2. API Gateway
**Technology**: FastAPI, Python 3.11, Pydantic

**Responsibilities**:
- Request routing
- Authentication/Authorization
- Input validation
- Response formatting
- Error handling

**Core Endpoints**:
```python
@app.post("/api/ingest") -> IngestResponse
@app.post("/api/summarize") -> SummaryResponse
@app.post("/api/materialize") -> MaterializationResponse
@app.get("/api/export/{patient_id}") -> ExportBundle
@app.get("/api/health") -> HealthStatus
```

### 3. Ingestion Service
**Technology**: Python, FHIR Client, asyncio

**Responsibilities**:
- Connect to FHIR servers
- Retrieve patient resources
- Validate FHIR data
- Bundle creation
- Resource aggregation

**Key Classes**:
```python
class FHIRIngestionService:
    async def connect(self, base_url: str) -> bool
    async def get_patient(self, patient_id: str) -> Patient
    async def get_resources(self, patient_ref: str, types: List[str]) -> Bundle
    async def validate_bundle(self, bundle: Bundle) -> ValidationResult
```

### 4. Summary Service
**Technology**: Python, LangChain, LLM SDKs

**Responsibilities**:
- LLM provider abstraction
- Prompt engineering
- Response parsing
- Contract validation
- Error recovery

**Provider Interface**:
```python
class LLMProvider(ABC):
    @abstractmethod
    async def generate_summary(
        self,
        patient_data: Bundle,
        config: SummaryConfig
    ) -> SummaryContract

class AnthropicProvider(LLMProvider):
    # Implementation

class OpenAIProvider(LLMProvider):
    # Implementation

class GeminiProvider(LLMProvider):
    # Implementation

class MockProvider(LLMProvider):
    # Deterministic implementation
```

### 5. Materialization Service
**Technology**: Python, FHIR Resources library

**Responsibilities**:
- FHIR resource construction
- Narrative generation
- PDF creation
- HAPI server interaction
- Provenance tracking

**Resource Builders**:
```python
class ResourceBuilder:
    def build_composition(self, summary: SummaryContract) -> Composition
    def build_lists(self, summary: SummaryContract) -> List[FHIRList]
    def build_document_reference(self, summary: SummaryContract) -> DocumentReference
    def build_provenance(self, targets: List[Reference]) -> Provenance
```

### 6. Export Service
**Technology**: Python, pandas, reportlab

**Responsibilities**:
- Format conversion (JSON, CSV, PDF)
- Bundle packaging
- Data filtering
- Compression

**Export Formats**:
```python
class ExportFormat(Enum):
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"
    BUNDLE = "bundle"

class ExportService:
    def export(self, data: Any, format: ExportFormat) -> bytes
```

## Data Flow

### 1. Ingestion Flow
```
User Input → Validate URL → Connect to FHIR → Retrieve Resources
→ Validate Data → Create Bundle → Store in Memory → Return Counts
```

### 2. Summary Generation Flow
```
Bundle Data → Extract Relevant Data → Build Prompt → Call LLM
→ Parse Response → Validate Contract → Handle Errors → Return Summary
```

### 3. Materialization Flow
```
Summary Data → Build FHIR Resources → Generate Narratives
→ Create Provenance → POST to HAPI → Return Resource IDs
```

## Data Models

### Core Contracts
```python
class SummaryContract(BaseModel):
    patient_name: str
    patient_dob: date
    patient_gender: str
    summary_date: datetime
    problems: List[Problem]
    medications: List[Medication]
    allergies: List[Allergy]
    vitals: List[VitalSigns]
    recent_labs: List[LabResult]
    procedures: List[Procedure]
    encounters: List[Encounter]
    care_gaps: List[CareGap]
    social_determinants: List[SocialDeterminant]
    risk_factors: List[RiskFactor]

class Problem(BaseModel):
    condition: str
    status: Literal["active", "resolved", "inactive"]
    onset_date: Optional[date]
    clinical_status: str
    verification_status: str
    category: Optional[str]
    severity: Optional[Literal["mild", "moderate", "severe"]]
    body_site: Optional[str]
    notes: Optional[str]
```

## Security Architecture

### Authentication & Authorization
- API key management for LLM providers
- CORS configuration for frontend
- Environment variable isolation
- No hardcoded secrets

### Data Protection
- HTTPS for all communications
- No PHI in logs
- Secure token storage
- Input sanitization

### Audit & Compliance
- Provenance tracking
- Access logging
- Error monitoring
- HIPAA considerations

## Deployment Architecture

### Docker Composition
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=${BACKEND_URL}

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - HAPI_BASE=${HAPI_BASE}

  hapi:
    image: hapiproject/hapi:latest
    ports: ["8080:8080"]
    volumes:
      - hapi-data:/data/hapi
```

### Scaling Strategy
1. **Horizontal Scaling**: Multiple backend instances
2. **Load Balancing**: Nginx or cloud LB
3. **Caching**: Redis for session/results
4. **Queue System**: Celery for async tasks

## Performance Requirements

### Response Times
- API Health: <100ms
- Data Ingestion: <10s for 100 resources
- Summary Generation: <60s
- Materialization: <5s
- Export: <3s

### Throughput
- Concurrent users: 100
- Requests per second: 50
- Daily summaries: 1000

### Resource Limits
- Memory: 2GB per container
- CPU: 2 cores per container
- Storage: 10GB for HAPI data

## Monitoring & Observability

### Metrics
- API response times
- LLM token usage
- Error rates
- Resource utilization

### Logging
- Application logs (JSON format)
- Access logs
- Error logs with stack traces
- Audit logs for PHI access

### Alerting
- Service health checks
- Error rate thresholds
- Performance degradation
- Security events

## Disaster Recovery

### Backup Strategy
- Daily HAPI database backups
- Configuration backups
- Document retention policy

### Recovery Procedures
1. Service restart procedures
2. Data restoration process
3. Rollback procedures
4. Communication plan