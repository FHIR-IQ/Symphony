/**
 * Claude AI service for generating medical summaries
 */

export interface SummaryRequest {
  patientData: any
  useCase: string
  detailLevel: string
  temperature: number
}

export class ClaudeService {
  private apiKey: string
  private baseUrl = 'https://api.anthropic.com/v1/messages'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateSummary(request: SummaryRequest): Promise<any> {
    const prompt = this.buildSummaryPrompt(request)

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: request.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${response.status} ${error}`)
    }

    const result = await response.json()
    return this.parseSummaryResponse(result.content[0].text)
  }

  private buildSummaryPrompt(request: SummaryRequest): string {
    return `
You are a medical AI assistant tasked with creating a comprehensive clinical summary from FHIR patient data.

PATIENT DATA:
${JSON.stringify(request.patientData, null, 2)}

REQUIREMENTS:
- Use case: ${request.useCase}
- Detail level: ${request.detailLevel}
- Create a structured JSON summary following the exact schema below

REQUIRED OUTPUT SCHEMA:
{
  "problems": [
    {
      "display": "Human readable condition name",
      "codes": [{"system": "ICD-10", "code": "diagnosis_code"}],
      "provenance": "Condition/resource_id",
      "onsetDate": "YYYY-MM-DD or estimated date"
    }
  ],
  "medications": [
    {
      "display": "Medication name and dosage",
      "codes": [{"system": "RxNorm", "code": "rxnorm_code"}],
      "status": "active|inactive|stopped",
      "provenance": "MedicationRequest/resource_id"
    }
  ],
  "allergies": [
    {
      "display": "Allergy description",
      "codes": [{"system": "SNOMED", "code": "snomed_code"}],
      "provenance": "AllergyIntolerance/resource_id",
      "onsetDate": "YYYY-MM-DD"
    }
  ],
  "vitals": [
    {
      "display": "Vital sign name",
      "value": "value with units",
      "date": "YYYY-MM-DD",
      "provenance": "Observation/resource_id"
    }
  ],
  "labs": [
    {
      "display": "Lab test name",
      "value": "result with units",
      "date": "YYYY-MM-DD",
      "provenance": "Observation/resource_id"
    }
  ],
  "procedures": [
    {
      "display": "Procedure description",
      "codes": [{"system": "CPT", "code": "procedure_code"}],
      "provenance": "Procedure/resource_id",
      "onsetDate": "YYYY-MM-DD"
    }
  ],
  "encounters": [
    {
      "display": "Encounter description",
      "type": "inpatient|outpatient|emergency|ambulatory",
      "provenance": "Encounter/resource_id"
    }
  ],
  "careGaps": [
    "List of identified care gaps or recommendations"
  ],
  "dataQualityNotes": [
    "Notes about data completeness or quality issues"
  ]
}

INSTRUCTIONS:
1. Extract all relevant clinical information from the FHIR resources
2. Group similar conditions and medications logically
3. Include proper medical terminology and codes where available
4. Reference the actual FHIR resource IDs in provenance fields
5. Identify care gaps based on clinical guidelines
6. Note any data quality issues or missing information
7. Return ONLY valid JSON matching the exact schema above

CRITICAL: Return only the JSON object, no additional text or explanation.
`
  }

  private parseSummaryResponse(response: string): any {
    try {
      // Extract JSON from response (handle cases where Claude might add text around JSON)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // Try parsing the full response as JSON
      return JSON.parse(response)
    } catch (error) {
      console.error('Failed to parse Claude response:', error)
      throw new Error('Invalid JSON response from Claude API')
    }
  }
}