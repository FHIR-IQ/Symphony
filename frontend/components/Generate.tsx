'use client'

import { useState } from 'react'
import { generateSummary } from '../lib/api'

interface GenerateProps {
  data: any
  updateData: (updates: any) => void
}

export default function Generate({ data, updateData }: GenerateProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean
    errors: string[]
  } | null>(null)

  const validateSummaryContract = (summary: any) => {
    const errors: string[] = []

    if (!summary || typeof summary !== 'object') {
      errors.push('Summary must be a valid object')
      return { isValid: false, errors }
    }

    // Check required top-level fields
    const requiredFields = ['problems', 'medications', 'allergies', 'vitals', 'labs', 'procedures', 'encounters', 'careGaps', 'dataQualityNotes']
    for (const field of requiredFields) {
      if (!Array.isArray(summary[field])) {
        errors.push(`Missing or invalid field: ${field} (must be an array)`)
      }
    }

    // Validate items with provenance
    const itemFields = ['problems', 'medications', 'allergies', 'procedures']
    for (const field of itemFields) {
      if (Array.isArray(summary[field])) {
        summary[field].forEach((item: any, index: number) => {
          if (!item.display) {
            errors.push(`${field}[${index}]: Missing required 'display' field`)
          }
          if (!item.provenance) {
            errors.push(`${field}[${index}]: Missing required 'provenance' field`)
          } else if (!item.provenance.includes('/')) {
            errors.push(`${field}[${index}]: Invalid provenance format (must be ResourceType/id)`)
          }
          if (!Array.isArray(item.codes)) {
            errors.push(`${field}[${index}]: Missing or invalid 'codes' field (must be an array)`)
          }
        })
      }
    }

    // Validate observation items (vitals, labs)
    const obsFields = ['vitals', 'labs']
    for (const field of obsFields) {
      if (Array.isArray(summary[field])) {
        summary[field].forEach((item: any, index: number) => {
          if (!item.display) {
            errors.push(`${field}[${index}]: Missing required 'display' field`)
          }
          if (!item.value) {
            errors.push(`${field}[${index}]: Missing required 'value' field`)
          }
          if (!item.provenance) {
            errors.push(`${field}[${index}]: Missing required 'provenance' field`)
          } else if (!item.provenance.includes('/')) {
            errors.push(`${field}[${index}]: Invalid provenance format (must be ResourceType/id)`)
          }
        })
      }
    }

    // Validate encounters
    if (Array.isArray(summary.encounters)) {
      summary.encounters.forEach((item: any, index: number) => {
        if (!item.display) {
          errors.push(`encounters[${index}]: Missing required 'display' field`)
        }
        if (!item.type) {
          errors.push(`encounters[${index}]: Missing required 'type' field`)
        }
        if (!item.provenance) {
          errors.push(`encounters[${index}]: Missing required 'provenance' field`)
        }
      })
    }

    return { isValid: errors.length === 0, errors }
  }

  const handleGenerate = async () => {
    if (!data.patientReference) {
      setGenerateError('No patient data ingested. Please complete Step 1 first.')
      return
    }

    if (!data.provider) {
      setGenerateError('No LLM provider selected. Please complete Step 3.')
      return
    }

    setIsGenerating(true)
    setGenerateError(null)
    setValidationStatus(null)

    try {
      const payload = {
        patientRef: data.patientReference,
        useCase: data.useCase || 'clinical_summary',
        method: data.method || 'comprehensive',
        detailLevel: data.detailLevel || 'standard',
        codingVerbosity: data.codingVerbosity || 'minimal',
        model: data.provider,
        temperature: data.temperature || 0.0,
        patientData: data.patientData // Include patient data for Claude processing
      }

      const result = await generateSummary(payload)

      // Validate the summary contract
      const validation = validateSummaryContract(result)
      setValidationStatus(validation)

      updateData({
        generatedSummary: result,
        summaryValidation: validation
      })
    } catch (error: any) {
      setGenerateError(error.message || 'Failed to generate summary. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = data.patientReference && data.provider && !isGenerating

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Step 4: Generate Summary</h2>

      {/* Configuration Review */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-3">Configuration Review</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="space-y-2">
              <div><strong>Patient:</strong> {data.patientReference || 'Not ingested'}</div>
              <div><strong>Audience:</strong> {data.audience || 'Not selected'}</div>
              <div><strong>Output Method:</strong> {data.method || 'Not selected'}</div>
              <div><strong>Detail Level:</strong> {data.detailLevel || 'Not selected'}</div>
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <div><strong>LLM Provider:</strong> {data.provider || 'Not selected'}</div>
              <div><strong>Model:</strong> {data.model || 'Auto-select'}</div>
              <div><strong>Temperature:</strong> {data.temperature?.toFixed(1) || '0.0'}</div>
              <div><strong>Use Case:</strong> {data.useCase || 'clinical_summary'}</div>
            </div>
          </div>
        </div>

        {data.ingestResult && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-sm text-gray-600">
              <strong>Ingested Resources:</strong>{' '}
              {Object.entries(data.ingestResult.resourceCounts || {}).map(([type, count]) => (
                <span key={type} className="mr-3">{type}: {count as number}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full py-4 px-6 font-medium rounded-lg transition-colors ${
            canGenerate
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Summary...
            </span>
          ) : (
            'Generate Summary'
          )}
        </button>

        {!canGenerate && (
          <div className="mt-2 text-sm text-gray-500">
            {!data.patientReference && '• Complete data ingestion first'}
            {!data.provider && '• Select an LLM provider'}
          </div>
        )}
      </div>

      {/* Error Display */}
      {generateError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Generation Failed</h3>
              <p className="text-sm text-red-700 mt-1">{generateError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Status */}
      {validationStatus && (
        <div className={`p-4 rounded-lg border ${
          validationStatus.isValid
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {validationStatus.isValid ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                validationStatus.isValid ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Schema Validation {validationStatus.isValid ? 'Passed ✓' : 'Failed'}
              </h3>
              {validationStatus.isValid ? (
                <p className="text-sm text-green-700 mt-1">
                  Summary contract is valid and ready for materialization.
                </p>
              ) : (
                <div className="text-sm text-yellow-700 mt-1">
                  <p className="mb-2">Schema validation errors found:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationStatus.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                    {validationStatus.errors.length > 5 && (
                      <li className="text-xs">... and {validationStatus.errors.length - 5} more errors</li>
                    )}
                  </ul>
                  <p className="mt-2 text-sm font-medium">
                    ⚠️ Materialization will be blocked until validation passes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Preview */}
      {data.generatedSummary && (
        <div className="border rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-medium">Generated Summary Preview</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><strong>Problems:</strong> {data.generatedSummary.problems?.length || 0}</div>
              <div><strong>Medications:</strong> {data.generatedSummary.medications?.length || 0}</div>
              <div><strong>Allergies:</strong> {data.generatedSummary.allergies?.length || 0}</div>
              <div><strong>Vitals:</strong> {data.generatedSummary.vitals?.length || 0}</div>
              <div><strong>Labs:</strong> {data.generatedSummary.labs?.length || 0}</div>
              <div><strong>Procedures:</strong> {data.generatedSummary.procedures?.length || 0}</div>
              <div><strong>Encounters:</strong> {data.generatedSummary.encounters?.length || 0}</div>
              <div><strong>Care Gaps:</strong> {data.generatedSummary.careGaps?.length || 0}</div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                View Raw JSON
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(data.generatedSummary, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}