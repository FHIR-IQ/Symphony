# Symphony - AI-Powered Medical Summary Generation

Symphony is a full-stack application that generates AI-powered clinical summaries from FHIR data using large language models, with proper validation and materialization back to FHIR resources.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   HAPI FHIR     │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   Server        │
│   Port 3000     │    │   Port 8000     │    │   Port 8080     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        └────────── Docker Compose Network ──────────────┘
```

## Features

✅ **5-Step Wizard Interface**: Guided workflow from data ingestion to materialization
✅ **Multi-LLM Support**: Anthropic Claude, OpenAI GPT, Google Gemini
✅ **FHIR Integration**: Read from any FHIR server, write to HAPI
✅ **Schema Validation**: Strict JSON contracts with provenance tracking
✅ **Multiple Output Formats**: Composition, Lists, DocumentReference + Provenance
✅ **Export Capabilities**: JSON, CSV, and complete FHIR bundles

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone & Setup

```bash
git clone <repository-url>
cd Symphony
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your API keys:

```env
# LLM Provider API Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here

# Model Provider (anthropic|openai|gemini|mock)
MODEL_PROVIDER=mock

# HAPI Configuration
HAPI_BASE=http://hapi:8080/fhir
```

### 3. Start Services

```bash
# Start all services (web, api, hapi)
docker-compose up -d

# Check service status
docker-compose ps
```

### 4. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **HAPI FHIR**: http://localhost:8080

## Step-by-Step Usage

### Step 1: Data Ingestion

1. Open http://localhost:3000
2. Select FHIR data source
3. Choose from public test servers or enter custom URL:
   - HAPI Test: `https://hapi.fhir.org/baseR4`
   - SMART Sandbox: `https://launch.smarthealthit.org/v/r4/fhir`
4. Enter Patient ID (try: `592912` for diabetes patient)
5. Select resource types to ingest
6. Click "Ingest Patient Data"

### Step 2: Summary Configuration

1. Choose target audience (Patient vs Provider)
2. Select FHIR output method:
   - **Composition**: Single FHIR Composition resource
   - **Lists**: Separate List resources by category
   - **Document**: DocumentReference with PDF attachment
   - **All**: Create all resource types
3. Set detail level (Simple/Advanced/Expert)
4. Configure medical coding verbosity

### Step 3: LLM Settings

1. Select model provider:
   - **Mock**: For testing without API calls
   - **Anthropic**: Claude 3 models
   - **OpenAI**: GPT-4 models
   - **Google**: Gemini models
2. Adjust temperature (0.0 = deterministic, 1.0 = creative)
3. Configure advanced options

### Step 4: Generate Summary

1. Review configuration summary
2. Click "Generate Summary"
3. Monitor real-time validation status
4. Review generated summary with counts and preview

### Step 5: Persist & Export

1. **Materialize to HAPI**: Write FHIR resources to server
2. **Export Options**:
   - JSON: Complete summary with metadata
   - CSV: Tabular format for analysis
3. **View Created Resources**: Direct links to HAPI viewer

## API Documentation

### Core Endpoints

#### Health Check
```bash
curl http://localhost:8000/api/health
# Response: {"status": "ok"}
```

#### Data Ingestion
```bash
curl -X POST http://localhost:8000/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "sourceBaseUrl": "https://hapi.fhir.org/baseR4",
    "patientId": "592912",
    "resources": ["Patient", "Condition", "Observation", "MedicationRequest"]
  }'

# Response: {
#   "message": "Successfully ingested patient data",
#   "patientReference": "Patient/592912",
#   "resourceCounts": {"Patient": 1, "Condition": 3, "Observation": 15},
#   "bundleId": "bundle-uuid"
# }
```

#### Summary Generation
```bash
curl -X POST http://localhost:8000/api/summarize \\
  -H "Content-Type: application/json" \\
  -d '{
    "patientRef": "Patient/592912",
    "useCase": "clinical_summary",
    "method": "composition",
    "detailLevel": "standard",
    "model": "mock",
    "temperature": 0.0
  }'

# Response: SummaryContract JSON with problems, medications, etc.
```

#### Materialization
```bash
curl -X POST http://localhost:8000/api/materialize \\
  -H "Content-Type: application/json" \\
  -d '{
    "summaryJSON": {...},
    "method": "composition",
    "authorDisplay": "Symphony AI Wizard",
    "docRefTags": ["ai-generated"],
    "sourceBundleRef": "Bundle/source-bundle-id"
  }'

# Response: {
#   "message": "Successfully created FHIR resources",
#   "compositionId": "Composition/uuid",
#   "listIds": ["List/uuid1", "List/uuid2"],
#   "documentReferenceId": "DocumentReference/uuid",
#   "provenanceId": "Provenance/uuid"
# }
```

#### Resource Viewer
```bash
# View any FHIR resource
curl http://localhost:8000/api/viewer/Composition/composition-id

# Direct HAPI redirect
curl http://localhost:8000/api/viewer/Patient/592912/raw
```

#### Export Patient Bundle
```bash
# Export all patient resources
curl http://localhost:8000/api/export/Patient/592912

# Export only Symphony-created artifacts
curl http://localhost:8000/api/export/Patient/592912/summary
```

## Development

### Local Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
python -m pytest tests/ -v
```

### Local Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Testing

```bash
# Backend tests
cd backend
python -m pytest tests/ -q

# All tests with coverage
python -m pytest tests/ --cov=app --cov-report=term-missing

# Quick validation test
python -m pytest tests/test_basic.py -v
```

## FHIR Resources Created

Symphony creates the following FHIR resources:

### 1. Composition
- **Type**: Clinical summary document
- **Sections**: Problems, Medications, Allergies, Vitals, Labs, Procedures, Encounters, Care Gaps
- **Narrative**: Human-readable XHTML

### 2. List Resources (if method=lists)
- Separate List for each clinical category
- References to original source resources
- Provenance tracking

### 3. DocumentReference (if method=document)
- PDF attachment with clinical summary
- Markdown source content
- Document metadata and categories

### 4. Provenance
- Tracks AI generation process
- Links to source Bundle
- Records Symphony as generating agent

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | - | Anthropic Claude API key |
| `OPENAI_API_KEY` | - | OpenAI GPT API key |
| `GOOGLE_API_KEY` | - | Google Gemini API key |
| `MODEL_PROVIDER` | `mock` | Active LLM provider |
| `HAPI_BASE` | `http://hapi:8080/fhir` | HAPI FHIR server URL |
| `BACKEND_URL` | `http://api:8000` | Backend URL for frontend |

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| `web` | 3000 | Next.js frontend |
| `api` | 8000 | FastAPI backend |
| `hapi` | 8080 | HAPI FHIR R4 server |

## Troubleshooting

### Services Won't Start

```bash
# Check Docker logs
docker-compose logs

# Restart specific service
docker-compose restart api

# Rebuild containers
docker-compose up --build
```

### API Connection Issues

```bash
# Test backend health
curl http://localhost:8000/api/health

# Test HAPI connection
curl http://localhost:8080/fhir/metadata

# Check network connectivity
docker-compose exec api ping hapi
```

### LLM Provider Issues

1. **Verify API keys** in `.env` file
2. **Check MODEL_PROVIDER** setting
3. **Use mock provider** for testing without API calls
4. **Review backend logs** for detailed error messages

### Data Quality Issues

1. **Check patient ID** exists in source FHIR server
2. **Verify resource types** are available
3. **Review validation errors** in Step 4
4. **Use public test servers** for reliable data

## Sample Data

### Test Patients

| Server | Patient ID | Description |
|--------|------------|-------------|
| HAPI Test | `592912` | Diabetes patient with medications |
| HAPI Test | `1551992` | Cardiac conditions patient |
| SMART Sandbox | `smart-1288992` | Comprehensive test patient |

### Test FHIR Servers

- **HAPI Test**: `https://hapi.fhir.org/baseR4`
- **SMART Sandbox**: `https://launch.smarthealthit.org/v/r4/fhir`

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `python -m pytest tests/ -q`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: GitHub Issues
- **Documentation**: This README
- **FHIR Specification**: https://hl7.org/fhir/R4/
- **Docker Help**: https://docs.docker.com/