'use client'

import { useState } from 'react'
import { ingestData } from '../lib/api'

interface SelectDataProps {
  data: any
  updateData: (updates: any) => void
}

export default function SelectData({ data, updateData }: SelectDataProps) {
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestResult, setIngestResult] = useState<any>(null)
  const [ingestError, setIngestError] = useState<string | null>(null)

  const availableResources = [
    'Patient',
    'Encounter',
    'Condition',
    'Observation',
    'MedicationRequest',
    'AllergyIntolerance',
    'Procedure',
    'DiagnosticReport',
    'Immunization',
    'CarePlan'
  ]

  const publicServers = [
    {
      name: 'HAPI FHIR Test Server',
      url: 'https://hapi.fhir.org/baseR4',
      description: 'Public test server with sample data'
    },
    {
      name: 'SMART Health IT Sandbox',
      url: 'https://launch.smarthealthit.org/v/r4/fhir',
      description: 'SMART on FHIR sandbox environment'
    }
  ]

  const samplePatients = [
    { id: '592912', description: 'Patient with diabetes and hypertension' },
    { id: '1551992', description: 'Patient with cardiac conditions' },
    { id: 'smart-1288992', description: 'SMART sandbox patient' }
  ]

  const handleIngest = async () => {
    if (!data.sourceBaseUrl || !data.patientId) {
      setIngestError('Please provide both FHIR server URL and Patient ID')
      return
    }

    if (!data.selectedResources || data.selectedResources.length === 0) {
      setIngestError('Please select at least one resource type to ingest')
      return
    }

    setIsIngesting(true)
    setIngestError(null)
    setIngestResult(null)

    try {
      const result = await ingestData({
        sourceBaseUrl: data.sourceBaseUrl,
        patientId: data.patientId,
        resources: data.selectedResources
      })

      setIngestResult(result)
      updateData({
        patientReference: result.patientReference,
        ingestResult: result,
        patientData: result.patientData // Store patient data for summary generation
      })
    } catch (error: any) {
      setIngestError(error.message || 'Failed to ingest data. Please try again.')
    } finally {
      setIsIngesting(false)
    }
  }

  const handleResourceToggle = (resource: string) => {
    const current = data.selectedResources || []
    const updated = current.includes(resource)
      ? current.filter((r: string) => r !== resource)
      : [...current, resource]

    updateData({ selectedResources: updated })
  }

  const handlePresetSelect = (server: any) => {
    updateData({
      sourceBaseUrl: server.url,
      dataSource: 'fhir'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-4">Step 1: Select Data Source</h2>
      </div>

      {/* Data Source Selection */}
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="radio"
            name="dataSource"
            value="fhir"
            checked={data.dataSource === 'fhir'}
            onChange={(e) => updateData({ dataSource: e.target.value })}
            className="mr-2"
          />
          <span className="font-medium">FHIR Server</span>
        </label>

        <label className="flex items-center opacity-50">
          <input
            type="radio"
            name="dataSource"
            value="file"
            disabled
            className="mr-2"
          />
          <span>Upload File (Coming Soon)</span>
        </label>

        <label className="flex items-center opacity-50">
          <input
            type="radio"
            name="dataSource"
            value="manual"
            disabled
            className="mr-2"
          />
          <span>Manual Input (Coming Soon)</span>
        </label>
      </div>

      {data.dataSource === 'fhir' && (
        <div className="space-y-4">
          {/* Server Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select (Public Test Servers)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {publicServers.map((server, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetSelect(server)}
                  className="text-left p-3 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-blue-600">{server.name}</div>
                  <div className="text-sm text-gray-500">{server.description}</div>
                  <div className="text-xs text-gray-400 font-mono">{server.url}</div>
                </button>
              ))}
            </div>
          </div>

          {/* FHIR Server URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FHIR Server Base URL
            </label>
            <input
              type="url"
              value={data.sourceBaseUrl || ''}
              onChange={(e) => updateData({ sourceBaseUrl: e.target.value })}
              placeholder="https://hapi.fhir.org/baseR4"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Patient ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient ID
            </label>
            <input
              type="text"
              value={data.patientId || ''}
              onChange={(e) => updateData({ patientId: e.target.value })}
              placeholder="e.g., 592912"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">Sample Patient IDs:</p>
              <div className="flex flex-wrap gap-2">
                {samplePatients.map((patient, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => updateData({ patientId: patient.id })}
                    className="px-3 py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200"
                    title={patient.description}
                  >
                    {patient.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resource Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Resource Types to Ingest
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableResources.map((resource) => (
                <label key={resource} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={(data.selectedResources || []).includes(resource)}
                    onChange={() => handleResourceToggle(resource)}
                    className="mr-2"
                  />
                  <span className="text-sm">{resource}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => updateData({ selectedResources: availableResources })}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => updateData({ selectedResources: [] })}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Ingest Button */}
          <div className="pt-4">
            <button
              onClick={handleIngest}
              disabled={isIngesting || !data.sourceBaseUrl || !data.patientId}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isIngesting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingesting Data...
                </span>
              ) : (
                'Ingest Patient Data'
              )}
            </button>
          </div>

          {/* Results */}
          {ingestError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{ingestError}</p>
                </div>
              </div>
            </div>
          )}

          {ingestResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <p className="text-sm text-green-700 mt-1">{ingestResult.message}</p>
                  <div className="mt-2 text-sm text-green-600">
                    <p><strong>Patient Reference:</strong> {ingestResult.patientReference}</p>
                    <p><strong>Resources Ingested:</strong></p>
                    <ul className="ml-4 mt-1">
                      {Object.entries(ingestResult.resourceCounts || {}).map(([type, count]) => (
                        <li key={type} className="list-disc">
                          {type}: {count as number} resources
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}