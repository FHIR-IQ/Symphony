# Symphony Project Constitution

## Core Principles

### 1. Spec-Driven Development
- All features MUST be specified before implementation
- Specifications define the "what" before the "how"
- Multi-step refinement of specifications is encouraged
- Intent and behavior are documented explicitly

### 2. FHIR Compliance
- All medical data interactions MUST adhere to FHIR R4 standards
- Resource validation MUST be performed before persistence
- Provenance tracking is REQUIRED for all generated content
- Interoperability with standard FHIR servers is mandatory

### 3. AI Safety & Ethics
- AI-generated content MUST be clearly marked with provenance
- Multiple LLM providers MUST be supported to avoid vendor lock-in
- Mock providers MUST be available for testing without API costs
- Temperature and model configuration MUST be user-controlled
- **AI MUST generate BOTH structured data AND narrative text**
- **Narratives MUST be medically accurate and contextually relevant**
- **All AI generation features MUST be tested and confirmed working**

### 4. Data Quality & Validation
- All data contracts MUST be explicitly defined with JSON schemas
- Validation MUST occur at every data transformation step
- Error handling MUST be comprehensive and user-friendly
- Data integrity MUST be maintained across all operations

### 5. User Experience
- The 5-step wizard interface MUST guide users through complex workflows
- Real-time validation feedback MUST be provided
- Export capabilities MUST support multiple formats
- Progress indicators MUST be shown for long-running operations
- **ALL UI elements MUST be fully functional - no placeholders**
- **Every configuration option MUST affect system behavior**
- **UI functionality MUST be comprehensively tested**

### 6. Architecture & Scalability
- Services MUST be containerized and orchestrated with Docker
- APIs MUST be RESTful and well-documented
- Frontend and backend MUST be decoupled
- Horizontal scaling MUST be supported

### 7. Security & Privacy
- **API keys MUST NEVER be committed to version control**
- **Environment variables MUST be used for all sensitive configuration**
- **API keys MUST be rotated regularly (production: 30 days)**
- **Different API keys MUST be used for different environments**
- Patient data MUST be handled with appropriate security measures
- CORS policies MUST be properly configured
- Authentication MUST be implemented for production use
- Logging MUST NOT expose sensitive information
- .gitignore MUST protect all environment and secret files

### 8. Testing & Quality
- All critical paths MUST have test coverage
- Contract validation tests are REQUIRED
- Integration tests MUST verify FHIR server interactions
- Mock providers MUST enable testing without external dependencies

### 9. Documentation
- All specifications MUST be maintained in the /specifications directory
- API documentation MUST be auto-generated where possible
- User guides MUST be provided for all features
- Code MUST be self-documenting with clear naming conventions

### 10. Open Source Collaboration
- MIT License ensures permissive open-source usage
- Contributions MUST follow established patterns
- Breaking changes MUST be documented
- Community feedback MUST be considered in design decisions