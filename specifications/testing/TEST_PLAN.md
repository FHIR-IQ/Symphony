# Symphony Test Plan

## Overview
This document defines the comprehensive testing strategy for Symphony, ensuring all specifications are validated and the system meets quality standards.

## Test Levels

### 1. Unit Tests
**Purpose**: Validate individual components and functions

**Scope**:
- Data transformation functions
- Validation logic
- FHIR resource builders
- Utility functions
- **UI component functionality**
- **Narrative generation logic**

**Framework**: pytest (backend), Jest/React Testing Library (frontend)

**Coverage Target**: 80% minimum (100% for UI interactions)

### 2. Integration Tests
**Purpose**: Validate component interactions

**Scope**:
- API endpoint testing
- FHIR server connectivity
- LLM provider integration
- Database operations

**Framework**: pytest with fixtures

**Key Test Areas**:
- End-to-end data flow
- Service communication
- Error propagation
- Transaction handling

### 3. Contract Tests
**Purpose**: Validate data contracts and schemas

**Scope**:
- JSON schema validation
- FHIR resource validation
- API request/response contracts
- LLM response validation

**Test Data**:
- Valid minimal examples
- Valid complete examples
- Invalid examples
- Edge case examples

### 4. System Tests
**Purpose**: Validate complete workflows

**Test Scenarios**:
1. **Complete Workflow**
   - Ingest patient data
   - Generate summary
   - Validate output
   - Materialize to FHIR
   - Export results

2. **Multi-Provider Test**
   - Test with each LLM provider
   - Compare outputs
   - Verify consistency

3. **Performance Test**
   - Large patient dataset (1000+ resources)
   - Concurrent users
   - Response time validation

### 5. Acceptance Tests
**Purpose**: Validate business requirements

**Method**: Behavior-Driven Development (BDD)

**Scenarios**:
```gherkin
Feature: Clinical Summary Generation
  Scenario: Generate provider-focused summary with narratives
    Given a patient with diabetes and hypertension
    When I request a provider-focused summary
    Then the summary should include all active problems
    And the summary should use medical terminology
    And the summary should identify care gaps
    And each section should have narrative text
    And narratives should match the JSON data

Feature: UI Functionality
  Scenario: All UI elements are functional
    Given I am on the Symphony application
    When I interact with any UI element
    Then it should perform its intended function
    And there should be no placeholder elements
    And all configuration options should work

Feature: Narrative Generation
  Scenario: AI generates complete narratives
    Given patient data is ingested
    When I generate a summary
    Then both JSON and narrative text are created
    And narratives are medically accurate
    And narratives are substantial and complete
```

## Test Data Strategy

### 1. Synthetic Data
- Use Synthea-generated patients
- Covers various clinical scenarios
- No PHI concerns

### 2. Mock Providers
- Deterministic responses
- No API costs
- Faster execution

### 3. Test Fixtures
- Pre-loaded FHIR bundles
- Known validation outcomes
- Error condition examples

## Test Execution

### Continuous Integration
```yaml
on: [push, pull_request]
jobs:
  test:
    - unit-tests
    - integration-tests
    - contract-validation
    - system-tests
```

### Local Testing
```bash
# Backend
cd backend
python -m pytest tests/ -v --cov=app

# Frontend
cd frontend
npm run test
npm run test:e2e

# Contract validation
python -m pytest tests/contracts/ -v

# System tests
docker-compose up -d
python -m pytest tests/system/ -v
```

## Test Cases

### Critical Path Tests

#### Test Case 1: Complete UI Functionality
**Preconditions**: Application running
**Steps**:
1. Test EVERY button clicks and performs action
2. Test EVERY form field accepts and validates input
3. Test EVERY configuration option affects output
4. Verify NO placeholder or "coming soon" elements exist
5. Confirm ALL menu items have working implementations

**Expected**: 100% UI elements functional

#### Test Case 2: Basic Summary Generation with Narratives
**Preconditions**: Mock provider configured
**Steps**:
1. Ingest patient 592912 from HAPI
2. Configure standard provider summary
3. Generate with mock provider
4. Validate against schema
5. **Verify BOTH JSON structure AND narrative text generated**
6. **Confirm narratives are substantial (>50 chars per section)**
7. **Validate narrative matches JSON data**

**Expected**: Summary passes validation with complete narratives

#### Test Case 3: FHIR Materialization with Narratives
**Preconditions**: Local HAPI running
**Steps**:
1. Use valid summary JSON with narratives
2. Materialize as Composition
3. **Verify narrative text included in FHIR resource**
4. Retrieve from HAPI
5. Validate resource structure
6. **Confirm XHTML narrative present and valid**

**Expected**: Valid FHIR Composition created with narratives

#### Test Case 4: UI Error Handling
**Preconditions**: Invalid API key
**Steps**:
1. Configure OpenAI provider
2. Attempt summary generation
3. Check error response

**Expected**: Graceful failure with clear error

### Edge Case Tests

1. **Empty Patient**: No clinical data - verify appropriate narratives
2. **Duplicate Resources**: Same resource multiple times
3. **Missing Required Data**: No patient demographics
4. **Timeout Handling**: Slow LLM response
5. **Large Dataset**: 5000+ resources
6. **UI Completeness**: No non-functional elements found
7. **Narrative Generation**: All sections have meaningful text
8. **Configuration Testing**: Every option changes behavior

### Security Tests

1. **API Key Protection**: Keys not logged
2. **Input Validation**: SQL injection prevention
3. **CORS Policy**: Proper header validation
4. **Rate Limiting**: Request throttling

## Test Metrics

### Quality Metrics
- Test coverage: >80%
- Test pass rate: >95%
- Defect escape rate: <5%
- Mean time to detect: <1 hour

### Performance Metrics
- Unit test execution: <30 seconds
- Integration test execution: <5 minutes
- System test execution: <15 minutes
- Summary generation: <60 seconds

## Test Environments

### Development
- Local Docker Compose
- Mock providers
- Test data fixtures

### Staging
- Cloud deployment
- Real FHIR servers
- Limited LLM usage

### Production
- Full monitoring
- Real-time validation
- Performance tracking

## Risk Mitigation

### High Risk Areas
1. **LLM Response Variability**: Use temperature 0
2. **FHIR Validation**: Strict schema checking
3. **Network Failures**: Retry logic
4. **Data Loss**: Transaction rollback

### Mitigation Strategies
1. Comprehensive validation
2. Graceful degradation
3. Detailed error logging
4. Automated rollback

## Tools

### Testing Frameworks
- pytest (Python)
- Jest (JavaScript)
- Postman (API)

### Validation Tools
- FHIR Validator
- JSON Schema Validator
- HAPI Testpage

### Monitoring
- Application logs
- Performance metrics
- Error tracking

## Responsibilities

### Developers
- Write unit tests with code
- Run tests before commit
- Fix failing tests

### QA Team
- Design test scenarios
- Execute system tests
- Report defects

### DevOps
- Maintain CI/CD pipeline
- Monitor test execution
- Deploy test environments