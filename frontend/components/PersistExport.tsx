'use client'

import { useState } from 'react'
import { materializeSummary } from '../lib/api'
import { DEMO_MODE } from '../lib/demo-data'

interface PersistExportProps {
  data: any
  updateData: (updates: any) => void
}

export default function PersistExport({ data, updateData }: PersistExportProps) {
  const [isMaterializing, setIsMaterializing] = useState(false)
  const [materializeError, setMaterializeError] = useState<string | null>(null)
  const [materializeResult, setMaterializeResult] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)

  const canMaterialize = data.generatedSummary && data.summaryValidation?.isValid

  const handleMaterialize = async () => {
    if (!canMaterialize) {
      setMaterializeError('Cannot materialize: Summary validation failed or no summary generated.')
      return
    }

    setIsMaterializing(true)
    setMaterializeError(null)
    setMaterializeResult(null)

    try {
      const payload = {
        summaryJSON: data.generatedSummary,
        method: data.method || 'composition',
        authorDisplay: 'Symphony AI Wizard',
        docRefTags: ['ai-generated', 'wizard-created', data.useCase || 'clinical-summary'],
        sourceBundleRef: data.ingestResult?.bundleId
      }

      const result = await materializeSummary(payload)
      setMaterializeResult(result)
      updateData({ materializeResult: result })
    } catch (error: any) {
      if (DEMO_MODE) {
        setMaterializeError('Demo mode: ' + (error.message || 'Network simulation error'))
      } else {
        setMaterializeError('Network error: Unable to reach backend. Please ensure services are running.')
      }
    } finally {
      setIsMaterializing(false)
    }
  }

  const handleExport = async (format: string) => {
    if (!data.generatedSummary) return

    setIsExporting(true)

    try {
      let content: string
      let filename: string
      let mimeType: string

      switch (format) {
        case 'JSON':
          content = JSON.stringify(data.generatedSummary, null, 2)
          filename = `symphony-summary-${Date.now()}.json`
          mimeType = 'application/json'
          break

        case 'CSV':
          // Simple CSV export of key data
          const csvRows = [
            ['Type', 'Display', 'Provenance', 'Additional Info'],
            ...data.generatedSummary.problems.map((p: any) => ['Problem', p.display, p.provenance, p.onsetDate || '']),
            ...data.generatedSummary.medications.map((m: any) => ['Medication', m.display, m.provenance, m.status || '']),
            ...data.generatedSummary.allergies.map((a: any) => ['Allergy', a.display, a.provenance, a.onsetDate || '']),
            ...data.generatedSummary.vitals.map((v: any) => ['Vital', v.display, v.provenance, v.value || '']),
            ...data.generatedSummary.labs.map((l: any) => ['Lab', l.display, l.provenance, l.value || '']),
            ...data.generatedSummary.procedures.map((p: any) => ['Procedure', p.display, p.provenance, p.onsetDate || '']),
            ...data.generatedSummary.encounters.map((e: any) => ['Encounter', e.display, e.provenance, e.type || '']),
            ...data.generatedSummary.careGaps.map((gap: string) => ['Care Gap', gap, 'N/A', '']),
            ...data.generatedSummary.dataQualityNotes.map((note: string) => ['Data Quality', note, 'N/A', ''])
          ]
          content = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
          filename = `symphony-summary-${Date.now()}.csv`
          mimeType = 'text/csv'
          break

        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error}`)
    } finally {
      setIsExporting(false)
    }
  }

  const getResourceViewerUrl = (resourceType: string, id: string) => {
    return `/api/viewer/${resourceType}/${id}`
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Step 5: Persist & Export</h2>

      {!data.generatedSummary ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg">No summary generated yet</p>
          <p className="text-sm">Please complete the previous steps to generate a summary first.</p>
        </div>
      ) : (
        <>
          {/* Summary Overview */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Summary Ready for Materialization</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <div><strong>Problems:</strong> {data.generatedSummary.problems?.length || 0}</div>
                <div><strong>Medications:</strong> {data.generatedSummary.medications?.length || 0}</div>
                <div><strong>Allergies:</strong> {data.generatedSummary.allergies?.length || 0}</div>
                <div><strong>Vitals:</strong> {data.generatedSummary.vitals?.length || 0}</div>
              </div>
              <div>
                <div><strong>Labs:</strong> {data.generatedSummary.labs?.length || 0}</div>
                <div><strong>Procedures:</strong> {data.generatedSummary.procedures?.length || 0}</div>
                <div><strong>Encounters:</strong> {data.generatedSummary.encounters?.length || 0}</div>
                <div><strong>Care Gaps:</strong> {data.generatedSummary.careGaps?.length || 0}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              <strong>Validation Status:</strong>{' '}
              {data.summaryValidation?.isValid ? (
                <span className="text-green-700">✓ Valid</span>
              ) : (
                <span className="text-red-700">✗ Invalid ({data.summaryValidation?.errors?.length || 0} errors)</span>
              )}
            </div>
          </div>

          {/* Write to HAPI */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Write to FHIR Server (HAPI)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create FHIR resources ({data.method || 'composition'}) in the HAPI server.
              {!canMaterialize && ' (Blocked due to validation errors)'}
            </p>

            <button
              onClick={handleMaterialize}
              disabled={!canMaterialize || isMaterializing}
              className={`w-full py-3 px-4 font-medium rounded-lg transition-colors ${
                canMaterialize && !isMaterializing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isMaterializing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Writing to HAPI...
                </span>
              ) : (
                'Write to HAPI Server'
              )}
            </button>

            {materializeError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Materialization Failed</h4>
                    <p className="text-sm text-red-700 mt-1">{materializeError}</p>
                  </div>
                </div>
              </div>
            )}

            {materializeResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-800">Success!</h4>
                    <p className="text-sm text-green-700 mt-1">{materializeResult.message}</p>

                    <div className="mt-3 space-y-2 text-sm">
                      {materializeResult.compositionId && (
                        <div>
                          <strong>Composition:</strong>{' '}
                          <a
                            href={getResourceViewerUrl('Composition', materializeResult.compositionId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View {materializeResult.compositionId}
                          </a>
                        </div>
                      )}

                      {materializeResult.listIds?.length > 0 && (
                        <div>
                          <strong>Lists:</strong>{' '}
                          {materializeResult.listIds.map((id: string, index: number) => (
                            <span key={id}>
                              <a
                                href={getResourceViewerUrl('List', id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {id}
                              </a>
                              {index < materializeResult.listIds.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}

                      {materializeResult.documentReferenceId && (
                        <div>
                          <strong>Document:</strong>{' '}
                          <a
                            href={getResourceViewerUrl('DocumentReference', materializeResult.documentReferenceId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View {materializeResult.documentReferenceId}
                          </a>
                        </div>
                      )}

                      {materializeResult.provenanceId && (
                        <div>
                          <strong>Provenance:</strong>{' '}
                          <a
                            href={getResourceViewerUrl('Provenance', materializeResult.provenanceId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View {materializeResult.provenanceId}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Export Summary</h3>
            <p className="text-sm text-gray-600 mb-4">Download the summary in various formats for external use.</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExport('JSON')}
                disabled={isExporting}
                className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isExporting ? 'Exporting...' : 'Export as JSON'}
              </button>

              <button
                onClick={() => handleExport('CSV')}
                disabled={isExporting}
                className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isExporting ? 'Exporting...' : 'Export as CSV'}
              </button>
            </div>

            <div className="mt-3 text-sm text-gray-500">
              <p>• JSON: Complete summary with all metadata and structure</p>
              <p>• CSV: Tabular format for spreadsheet analysis</p>
            </div>
          </div>

          {/* Direct HAPI Access */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-2">Direct HAPI Access</h3>
            <p className="text-sm text-gray-600 mb-3">Access the HAPI FHIR server directly to view all resources.</p>

            <div className="space-y-2">
              <a
                href="http://localhost:8080"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open HAPI FHIR Server
              </a>

              {data.patientReference && (
                <div className="text-sm text-gray-600 mt-2">
                  <strong>Patient Reference:</strong> {data.patientReference}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}