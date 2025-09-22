'use client'

import { useState } from 'react'
import SelectData from '@/components/SelectData'
import ChooseSummary from '@/components/ChooseSummary'
import LLMSettings from '@/components/LLMSettings'
import Generate from '@/components/Generate'
import PersistExport from '@/components/PersistExport'

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState({
    // Step 1: Data Source
    dataSource: 'fhir',
    sourceBaseUrl: '',
    patientId: '',
    selectedResources: ['Patient', 'Encounter', 'Condition', 'Observation', 'MedicationRequest', 'AllergyIntolerance'],
    patientReference: '',
    ingestResult: null,

    // Step 2: Summary Configuration
    audience: '',
    method: '',
    detailLevel: '',
    codingVerbosity: 'minimal',
    includeDataQuality: true,
    includeCareGaps: true,
    useCase: 'clinical_summary',

    // Step 3: LLM Settings
    provider: '',
    model: '',
    temperature: 0.0,
    strictJson: true,
    retryOnFailure: true,

    // Step 4: Generated Content
    generatedSummary: null,
    summaryValidation: null,

    // Step 5: Materialization
    materializeResult: null,
  })

  const steps = [
    { number: 1, name: 'Select Data', component: SelectData },
    { number: 2, name: 'Choose Summary', component: ChooseSummary },
    { number: 3, name: 'LLM Settings', component: LLMSettings },
    { number: 4, name: 'Generate', component: Generate },
    { number: 5, name: 'Persist/Export', component: PersistExport },
  ]

  const CurrentStepComponent = steps[currentStep - 1].component

  // Check if steps are completed based on required data
  const isStepCompleted = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return wizardData.patientReference && wizardData.ingestResult
      case 2:
        return wizardData.audience && wizardData.method && wizardData.detailLevel
      case 3:
        return wizardData.provider
      case 4:
        return wizardData.generatedSummary && wizardData.summaryValidation
      case 5:
        return wizardData.materializeResult
      default:
        return false
    }
  }

  const canNavigateToStep = (stepNumber: number) => {
    if (stepNumber === 1) return true
    if (stepNumber === 2) return isStepCompleted(1)
    if (stepNumber === 3) return isStepCompleted(1) && isStepCompleted(2)
    if (stepNumber === 4) return isStepCompleted(1) && isStepCompleted(2) && isStepCompleted(3)
    if (stepNumber === 5) return isStepCompleted(1) && isStepCompleted(2) && isStepCompleted(3) && isStepCompleted(4)
    return false
  }

  const getNextEnabledStep = () => {
    for (let i = currentStep + 1; i <= 5; i++) {
      if (canNavigateToStep(i)) return i
    }
    return currentStep
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Symphony - AI Summary Wizard</h1>

        <div className="mb-8">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            {steps.map((step) => {
              const isCompleted = isStepCompleted(step.number)
              const isCurrent = step.number === currentStep
              const canNavigate = canNavigateToStep(step.number)

              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center cursor-pointer ${
                    isCurrent ? 'text-blue-600' :
                    isCompleted ? 'text-green-600' :
                    canNavigate ? 'text-gray-600 hover:text-blue-500' : 'text-gray-400'
                  }`}
                  onClick={() => canNavigate && setCurrentStep(step.number)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : canNavigate
                        ? 'bg-gray-300 hover:bg-gray-400'
                        : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? '✓' : step.number}
                  </div>
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <CurrentStepComponent
            data={wizardData}
            updateData={(updates: any) => setWizardData({ ...wizardData, ...updates })}
          />

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
            >
              Previous
            </button>

            {currentStep < 5 && (
              <button
                onClick={() => setCurrentStep(getNextEnabledStep())}
                disabled={!canNavigateToStep(currentStep + 1)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            )}

            {currentStep === 5 && (
              <div className="text-sm text-gray-500 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Workflow Complete
              </div>
            )}
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="max-w-3xl mx-auto mt-4 p-4 bg-gray-100 rounded-lg">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Debug: Wizard State
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {JSON.stringify(wizardData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </main>
  )
}