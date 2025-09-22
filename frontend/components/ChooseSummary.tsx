interface ChooseSummaryProps {
  data: any
  updateData: (updates: any) => void
}

export default function ChooseSummary({ data, updateData }: ChooseSummaryProps) {
  const audienceOptions = [
    {
      value: 'patient',
      label: 'Patient',
      description: 'Patient-friendly language, easy to understand'
    },
    {
      value: 'provider',
      label: 'Provider',
      description: 'Clinical terminology, comprehensive details'
    }
  ]

  const methodOptions = [
    {
      value: 'composition',
      label: 'Composition',
      description: 'FHIR Composition with structured sections'
    },
    {
      value: 'lists',
      label: 'Lists',
      description: 'Separate FHIR List resources for each category'
    },
    {
      value: 'document',
      label: 'DocumentReference',
      description: 'Document with markdown and PDF attachments'
    },
    {
      value: 'all',
      label: 'All Types',
      description: 'Create all resource types for maximum compatibility'
    }
  ]

  const detailLevels = [
    {
      value: 'minimal',
      label: 'Simple',
      description: 'Essential information only, concise format'
    },
    {
      value: 'standard',
      label: 'Advanced',
      description: 'Balanced detail level with key insights'
    },
    {
      value: 'detailed',
      label: 'Expert',
      description: 'Comprehensive information, full clinical context'
    }
  ]

  const codingVerbosityOptions = [
    { value: 'none', label: 'Off', description: 'No medical codes included' },
    { value: 'minimal', label: 'Minimal', description: 'Primary codes only' },
    { value: 'full', label: 'Full', description: 'All available coding systems' }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Step 2: Choose Summary Configuration</h2>

      {/* Audience Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Target Audience
        </label>
        <div className="grid grid-cols-2 gap-3">
          {audienceOptions.map((option) => (
            <label
              key={option.value}
              className={`relative flex cursor-pointer rounded-lg p-4 border transition-colors ${
                data.audience === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="audience"
                value={option.value}
                checked={data.audience === option.value}
                onChange={(e) => updateData({ audience: e.target.value })}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  {data.audience === option.value && (
                    <svg className="ml-2 h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* FHIR Resource Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          FHIR Output Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          {methodOptions.map((option) => (
            <label
              key={option.value}
              className={`relative flex cursor-pointer rounded-lg p-4 border transition-colors ${
                data.method === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="method"
                value={option.value}
                checked={data.method === option.value}
                onChange={(e) => updateData({ method: e.target.value })}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  {data.method === option.value && (
                    <svg className="ml-2 h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Detail Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Detail Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {detailLevels.map((level) => (
            <label
              key={level.value}
              className={`relative flex cursor-pointer rounded-lg p-4 border transition-colors ${
                data.detailLevel === level.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="detailLevel"
                value={level.value}
                checked={data.detailLevel === level.value}
                onChange={(e) => updateData({ detailLevel: e.target.value })}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">{level.label}</div>
                  {data.detailLevel === level.value && (
                    <svg className="ml-2 h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">{level.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Additional Options</h3>

        {/* Coding Verbosity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical Coding Verbosity
          </label>
          <div className="flex space-x-4">
            {codingVerbosityOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="codingVerbosity"
                  value={option.value}
                  checked={data.codingVerbosity === option.value}
                  onChange={(e) => updateData({ codingVerbosity: e.target.value })}
                  className="mr-2"
                />
                <div>
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Data Quality Notes Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Data Quality Notes</div>
            <div className="text-sm text-gray-500">Include observations about data completeness and quality</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.includeDataQuality !== false}
              onChange={(e) => updateData({ includeDataQuality: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Care Gaps Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900">Care Gap Analysis</div>
            <div className="text-sm text-gray-500">Identify potential gaps in care and missing screenings</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.includeCareGaps !== false}
              onChange={(e) => updateData({ includeCareGaps: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Summary Display */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Configuration Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Audience:</strong> {data.audience ? audienceOptions.find(o => o.value === data.audience)?.label : 'Not selected'}</p>
          <p><strong>Output Method:</strong> {data.method ? methodOptions.find(o => o.value === data.method)?.label : 'Not selected'}</p>
          <p><strong>Detail Level:</strong> {data.detailLevel ? detailLevels.find(o => o.value === data.detailLevel)?.label : 'Not selected'}</p>
          <p><strong>Coding:</strong> {data.codingVerbosity ? codingVerbosityOptions.find(o => o.value === data.codingVerbosity)?.label : 'Not selected'}</p>
          <p><strong>Data Quality Notes:</strong> {data.includeDataQuality !== false ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Care Gap Analysis:</strong> {data.includeCareGaps !== false ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
    </div>
  )
}