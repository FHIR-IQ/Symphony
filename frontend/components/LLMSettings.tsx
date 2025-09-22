import { useState } from 'react'

interface LLMSettingsProps {
  data: any
  updateData: (updates: any) => void
}

export default function LLMSettings({ data, updateData }: LLMSettingsProps) {
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false)

  const providers = [
    {
      value: 'anthropic',
      label: 'Anthropic',
      description: 'Claude 3 models - excellent reasoning and safety',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      envVar: 'ANTHROPIC_API_KEY'
    },
    {
      value: 'openai',
      label: 'OpenAI',
      description: 'GPT models - versatile and well-documented',
      models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
      envVar: 'OPENAI_API_KEY'
    },
    {
      value: 'gemini',
      label: 'Google',
      description: 'Gemini models - multimodal capabilities',
      models: ['gemini-pro', 'gemini-pro-vision'],
      envVar: 'GOOGLE_API_KEY'
    },
    {
      value: 'mock',
      label: 'Mock (Demo)',
      description: 'For testing without real API calls',
      models: ['mock-model'],
      envVar: null
    }
  ]

  const selectedProvider = providers.find(p => p.value === data.provider)

  const handleTemperatureChange = (value: number) => {
    updateData({ temperature: value })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Step 3: LLM Settings</h2>

      {/* Model Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Model Provider
        </label>
        <div className="space-y-3">
          {providers.map((provider) => (
            <label
              key={provider.value}
              className={`relative flex cursor-pointer rounded-lg p-4 border transition-colors ${
                data.provider === provider.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="provider"
                value={provider.value}
                checked={data.provider === provider.value}
                onChange={(e) => updateData({ provider: e.target.value })}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{provider.label}</div>
                    <div className="text-sm text-gray-500">{provider.description}</div>
                    {provider.envVar && (
                      <div className="text-xs text-gray-400 mt-1">
                        Environment variable: {provider.envVar}
                      </div>
                    )}
                  </div>
                  {data.provider === provider.value && (
                    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* API Key Configuration Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">API Key Configuration</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                API keys are configured server-side via environment variables for security.
                No API keys are transmitted to or stored in the frontend.
                {' '}
                <button
                  type="button"
                  onClick={() => setShowApiKeyInfo(!showApiKeyInfo)}
                  className="underline hover:text-yellow-900"
                >
                  {showApiKeyInfo ? 'Hide details' : 'Learn more'}
                </button>
              </p>
              {showApiKeyInfo && (
                <div className="mt-3 p-3 bg-yellow-100 rounded text-xs">
                  <p className="font-medium mb-2">Environment Variables:</p>
                  <ul className="space-y-1 font-mono">
                    <li>ANTHROPIC_API_KEY=your_anthropic_key</li>
                    <li>OPENAI_API_KEY=your_openai_key</li>
                    <li>GOOGLE_API_KEY=your_google_key</li>
                    <li>MODEL_PROVIDER=anthropic|openai|gemini|mock</li>
                  </ul>
                  <p className="mt-2">
                    Set these in your .env file or environment before starting the backend service.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      {selectedProvider && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specific Model (Optional)
          </label>
          <select
            value={data.model || ''}
            onChange={(e) => updateData({ model: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Auto-select best model</option>
            {selectedProvider.models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Leave blank to use the default model for {selectedProvider.label}
          </p>
        </div>
      )}

      {/* Temperature Slider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperature: {data.temperature?.toFixed(1) || '0.0'}
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={data.temperature || 0}
            onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>0.0 - Precise, Deterministic</span>
            <span>1.0 - Creative, Random</span>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {data.temperature <= 0.2 && 'Very focused and deterministic responses'}
            {data.temperature > 0.2 && data.temperature <= 0.5 && 'Balanced creativity and consistency'}
            {data.temperature > 0.5 && data.temperature <= 0.8 && 'More creative and varied responses'}
            {data.temperature > 0.8 && 'Highly creative but less predictable'}
          </div>
        </div>
      </div>

      {/* Use Case Specific Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Use Case
        </label>
        <select
          value={data.useCase || 'clinical_summary'}
          onChange={(e) => updateData({ useCase: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="clinical_summary">Clinical Summary</option>
          <option value="discharge_summary">Discharge Summary</option>
          <option value="referral">Referral Summary</option>
          <option value="patient_portal">Patient Portal Summary</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Different use cases may influence prompt engineering and output formatting
        </p>
      </div>

      {/* Advanced Options */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Advanced Options</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">Strict JSON Mode</div>
              <div className="text-sm text-gray-500">Force structured JSON output (recommended)</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.strictJson !== false}
                onChange={(e) => updateData({ strictJson: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">Retry on Validation Failure</div>
              <div className="text-sm text-gray-500">Automatically retry if output doesn't match schema</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.retryOnFailure !== false}
                onChange={(e) => updateData({ retryOnFailure: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">LLM Configuration Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Provider:</strong> {selectedProvider?.label || 'Not selected'}</p>
          <p><strong>Model:</strong> {data.model || 'Auto-select'}</p>
          <p><strong>Temperature:</strong> {data.temperature?.toFixed(1) || '0.0'}</p>
          <p><strong>Use Case:</strong> {data.useCase || 'clinical_summary'}</p>
          <p><strong>JSON Mode:</strong> {data.strictJson !== false ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Auto Retry:</strong> {data.retryOnFailure !== false ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
    </div>
  )
}