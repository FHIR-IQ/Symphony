# Feature Specification: AI Narrative Generation

## Intent
Generate comprehensive, medically accurate narrative text alongside structured JSON data, ensuring both components work together to provide complete clinical summaries.

## User Story
As a healthcare provider, I need both structured data AND human-readable narratives so that I can quickly understand patient status while having detailed data for analysis.

## Acceptance Criteria

### Functional Requirements

1. **Dual Output Generation**
   - System MUST generate BOTH JSON structures AND narrative text
   - Every JSON section MUST have corresponding narrative
   - Narratives MUST NOT be empty or placeholder text
   - Both outputs MUST be generated in single API call
   - Generation MUST be tested and confirmed working

2. **Narrative Quality Requirements**
   - **Medical Accuracy**: Use correct medical terminology
   - **Contextual Relevance**: Narratives relate to patient data
   - **Completeness**: Cover all important findings
   - **Clarity**: Understandable by target audience
   - **Consistency**: Match JSON data exactly

3. **Section-Specific Narratives**

   **Problems/Conditions Narrative**:
   ```
   "The patient has 3 active conditions: Type 2 Diabetes Mellitus
   (diagnosed 2019, well-controlled), Essential Hypertension
   (diagnosed 2018, stable on medication), and Hyperlipidemia
   (diagnosed 2020, improving with statin therapy)."
   ```

   **Medications Narrative**:
   ```
   "Current medications include Metformin 500mg twice daily for
   diabetes management, Lisinopril 10mg daily for blood pressure
   control, and Atorvastatin 20mg at bedtime for cholesterol."
   ```

   **Vital Signs Narrative**:
   ```
   "Most recent vital signs from January 15, 2024 show blood
   pressure 128/76 mmHg (controlled), heart rate 72 bpm (normal),
   temperature 98.6°F, and BMI 26.3 (slightly overweight)."
   ```

   **Laboratory Results Narrative**:
   ```
   "Recent labs show HbA1c of 6.8% (good diabetic control),
   LDL cholesterol 95 mg/dL (at goal), and normal kidney
   function with creatinine 0.9 mg/dL."
   ```

   **Care Gaps Narrative**:
   ```
   "Identified care gaps include: overdue diabetic eye exam
   (last completed 18 months ago), pending colorectal cancer
   screening (patient age 52), and need for pneumococcal
   vaccination based on diabetes diagnosis."
   ```

4. **Audience-Specific Language**

   **Provider-Focused**:
   - Technical terminology
   - ICD-10/CPT codes included
   - Clinical decision support
   - Differential considerations

   **Patient-Focused**:
   - Plain language explanations
   - Avoidance of medical jargon
   - Action-oriented guidance
   - Educational context

5. **Integration Requirements**
   - Narratives MUST be embedded in FHIR resources
   - XHTML generation for FHIR narrative element
   - PDF generation MUST include narratives
   - Export formats MUST preserve narratives

## Technical Specifications

### Data Structure with Narratives

```json
{
  "summary": {
    "patient_name": "John Doe",
    "problems": [
      {
        "condition": "Type 2 Diabetes Mellitus",
        "status": "active",
        "onset_date": "2019-03-15"
      }
    ],
    "problems_narrative": "The patient has Type 2 Diabetes Mellitus, diagnosed in March 2019, currently active and managed with medication.",

    "medications": [
      {
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "twice daily"
      }
    ],
    "medications_narrative": "Current medications include Metformin 500mg taken twice daily for diabetes management.",

    "vitals": [...],
    "vitals_narrative": "Recent vital signs are within normal limits...",

    "labs": [...],
    "labs_narrative": "Laboratory results indicate good glycemic control...",

    "care_gaps": [...],
    "care_gaps_narrative": "The following preventive care services are due...",

    "overall_narrative": "This 58-year-old male patient with Type 2 Diabetes..."
  }
}
```

### Prompt Engineering for Narratives

```python
NARRATIVE_PROMPT = """
Generate a clinical summary with BOTH structured data AND narrative text.

For each section, provide:
1. Structured JSON data with all fields
2. A narrative summary that explains the data in prose

Requirements:
- Narratives must be medically accurate
- Use {audience} appropriate language
- Include all significant findings
- Maintain consistency between JSON and narrative
- Generate complete sentences, not fragments

Target audience: {audience}
Detail level: {detail_level}
"""
```

### Validation Requirements

```python
def validate_narrative_generation(summary):
    """Validate both JSON structure and narrative content"""

    # Check JSON structure exists
    assert summary.get('problems') is not None
    assert summary.get('medications') is not None

    # Check narratives exist and are substantial
    assert summary.get('problems_narrative')
    assert len(summary['problems_narrative']) > 50

    # Check narrative quality
    assert not summary['problems_narrative'].startswith('Lorem ipsum')
    assert 'TODO' not in summary['problems_narrative']
    assert 'placeholder' not in summary['problems_narrative'].lower()

    # Check narrative matches JSON data
    for problem in summary['problems']:
        assert problem['condition'] in summary['problems_narrative']

    # Check medical terminology
    if audience == 'provider':
        assert has_medical_terms(summary['problems_narrative'])
    else:
        assert has_plain_language(summary['problems_narrative'])
```

## Test Scenarios

### Functional Tests

1. **Narrative Generation Test**
   ```python
   def test_narrative_generation():
       response = generate_summary(patient_data)

       # Verify all narratives present
       assert response['problems_narrative']
       assert response['medications_narrative']
       assert response['vitals_narrative']

       # Verify narrative quality
       assert len(response['problems_narrative']) > 100
       assert 'patient' in response['problems_narrative'].lower()
   ```

2. **Consistency Test**
   ```python
   def test_narrative_data_consistency():
       response = generate_summary(patient_data)

       # Every condition in JSON appears in narrative
       for condition in response['problems']:
           assert condition['condition'] in response['problems_narrative']
   ```

3. **Audience Appropriateness Test**
   ```python
   def test_audience_language():
       # Provider language
       provider_summary = generate_summary(data, audience='provider')
       assert 'ICD-10' in provider_summary['problems_narrative']

       # Patient language
       patient_summary = generate_summary(data, audience='patient')
       assert 'ICD-10' not in patient_summary['problems_narrative']
       assert 'your' in patient_summary['problems_narrative'].lower()
   ```

### Edge Cases

1. **Empty Sections**: Generate appropriate "no data" narratives
2. **Single Item**: Singular vs plural grammar
3. **Many Items**: Summarization without losing key details
4. **Missing Data**: Handle gracefully with partial narratives
5. **Complex Medical Terms**: Appropriate simplification for patients

### Quality Assurance Tests

1. **Medical Accuracy Review**
   - Clinical staff review narratives
   - Verify medical terminology correctness
   - Check clinical logic and reasoning

2. **Readability Testing**
   - Flesch Reading Ease score for patient narratives
   - Technical accuracy for provider narratives

3. **Completeness Validation**
   - All JSON data represented in narrative
   - No important findings omitted
   - Context provided where needed

## Implementation Notes

### LLM Configuration

```python
class NarrativeGenerator:
    def __init__(self, provider, model):
        self.provider = provider
        self.model = model
        self.temperature = 0.3  # Lower for consistency

    def generate(self, patient_data, config):
        # Build comprehensive prompt
        prompt = self.build_prompt(patient_data, config)

        # Generate with validation
        response = self.llm.generate(prompt)

        # Validate has both JSON and narratives
        self.validate_dual_output(response)

        return response

    def validate_dual_output(self, response):
        """Ensure both JSON and narratives present"""
        for section in REQUIRED_SECTIONS:
            assert section in response
            assert f"{section}_narrative" in response
            assert len(response[f"{section}_narrative"]) > 50
```

### FHIR Integration

```xml
<!-- FHIR Composition with narrative -->
<Composition>
  <text>
    <status value="generated"/>
    <div xmlns="http://www.w3.org/1999/xhtml">
      <h2>Clinical Summary</h2>
      <h3>Active Problems</h3>
      <p>The patient has 3 active conditions: Type 2 Diabetes...</p>
      <h3>Current Medications</h3>
      <p>Current medications include Metformin 500mg...</p>
    </div>
  </text>
  <section>
    <title value="Problems"/>
    <text>
      <status value="generated"/>
      <div>The patient has Type 2 Diabetes...</div>
    </text>
  </section>
</Composition>
```

## Success Metrics

- **100% of summaries include narratives**
- **0 empty or placeholder narratives**
- **95% narrative-data consistency**
- **90% clinical accuracy (provider review)**
- **80% readability score for patient narratives**
- **All sections have meaningful narratives**
- **Narratives tested and confirmed working**

## Continuous Improvement

### Monitoring
- Track narrative generation success rate
- Monitor narrative length and quality
- Collect user feedback on narrative usefulness
- A/B test different narrative styles

### Optimization
- Fine-tune prompts for better narratives
- Adjust temperature for consistency
- Implement narrative templates for common patterns
- Cache frequently used narrative segments

### Quality Control
- Regular clinical review of narratives
- Automated quality checks
- User satisfaction surveys
- Continuous prompt refinement