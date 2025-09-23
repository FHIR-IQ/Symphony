'use client';

import React, { useState, useEffect } from 'react';

export default function HAPIStyleFHIRViewer() {
  const [serverUrl, setServerUrl] = useState('https://hapi.fhir.org/baseR4');
  const [resourceType, setResourceType] = useState('Patient');
  const [searchParams, setSearchParams] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);

  const commonResourceTypes = [
    'Patient', 'Practitioner', 'Organization', 'Encounter', 'Observation',
    'Condition', 'Procedure', 'MedicationRequest', 'AllergyIntolerance',
    'Immunization', 'CarePlan', 'Goal', 'Bundle', 'Composition',
    'DiagnosticReport', 'DocumentReference', 'Location', 'Medication'
  ];

  // Test server connection and get metadata
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/viewer?resourceType=CapabilityStatement&resourceId=metadata');
      if (!response.ok) {
        throw new Error(`Server connection failed: ${response.status}`);
      }
      const metadata = await response.json();
      setServerInfo(metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to FHIR server');
    } finally {
      setLoading(false);
    }
  };

  // Search for resources
  const searchResources = async () => {
    setLoading(true);
    setError(null);
    setSelectedResource(null);
    try {
      const params = new URLSearchParams({ resourceType });
      if (searchParams) {
        const searchParamsObj = new URLSearchParams(searchParams);
        searchParamsObj.forEach((value, key) => {
          params.append(key, value);
        });
      }

      const response = await fetch(`/api/fhir-search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const bundle = await response.json();
      if (bundle.entry && bundle.entry.length > 0) {
        const resourceList = bundle.entry.map((entry: any) => entry.resource);
        setResources(resourceList);
      } else {
        setResources([]);
        setError('No resources found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual resource
  const fetchResource = async (resourceType: string, resourceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ resourceType, resourceId });
      const response = await fetch(`/api/viewer?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const resource = await response.json();
      setSelectedResource(resource);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resource');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HAPI FHIR Style Header */}
      <div className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">HAPI FHIR Server</h1>
              <p className="text-blue-200 text-sm">Symphony AI FHIR Browser Interface</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">FHIR R4</p>
              <p className="text-xs text-blue-300">Connected to: {serverUrl}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Server Status Card */}
        {serverInfo && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Server Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Status:</strong> <span className="text-green-600">✅ Connected</span>
              </div>
              <div>
                <strong>FHIR Version:</strong> {serverInfo.fhirVersion || 'R4'}
              </div>
              <div>
                <strong>Publisher:</strong> {serverInfo.publisher || 'HAPI FHIR'}
              </div>
            </div>
          </div>
        )}

        {/* Search Interface */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Resource Search</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Type
                </label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {commonResourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Parameters
                </label>
                <input
                  type="text"
                  value={searchParams}
                  onChange={(e) => setSearchParams(e.target.value)}
                  placeholder="name=Smith, gender=male, _count=10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={searchResources}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Quick Search Examples */}
            <div className="text-sm text-gray-600">
              <strong>Examples:</strong>
              <button
                onClick={() => {setResourceType('Patient'); setSearchParams(''); searchResources();}}
                className="ml-2 text-blue-600 hover:underline"
              >
                All Patients
              </button>
              <button
                onClick={() => {setResourceType('Patient'); setSearchParams('gender=male'); searchResources();}}
                className="ml-2 text-blue-600 hover:underline"
              >
                Male Patients
              </button>
              <button
                onClick={() => {setResourceType('Observation'); setSearchParams('category=vital-signs'); searchResources();}}
                className="ml-2 text-blue-600 hover:underline"
              >
                Vital Signs
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Results */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results ({resources.length} {resourceType} resources)
              </h3>
            </div>
            <div className="p-6">
              {resources.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {loading ? 'Searching...' : 'No resources found. Try searching above.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {resources.map((resource, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedResource(resource)}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedResource === resource
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {resource.resourceType}/{resource.id}
                          </div>
                          {resource.name && (
                            <div className="text-sm text-gray-600 mt-1">
                              {Array.isArray(resource.name)
                                ? resource.name.map((n: any) => `${n.given?.join(' ')} ${n.family}`).join(', ')
                                : resource.name
                              }
                            </div>
                          )}
                          {resource.status && (
                            <div className="text-xs text-gray-500 mt-1">
                              Status: {resource.status}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {resource.meta?.lastUpdated && new Date(resource.meta.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resource Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Resource Details
                {selectedResource && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    {selectedResource.resourceType}/{selectedResource.id}
                  </span>
                )}
              </h3>
            </div>
            <div className="p-6">
              {!selectedResource ? (
                <p className="text-gray-500 text-center py-8">
                  Select a resource from the search results to view details
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Resource Header */}
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-lg">{selectedResource.resourceType}</h4>
                    <p className="text-sm text-gray-600">ID: {selectedResource.id}</p>
                    {selectedResource.meta?.lastUpdated && (
                      <p className="text-xs text-gray-500">
                        Last Updated: {new Date(selectedResource.meta.lastUpdated).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* JSON Viewer */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium">Raw JSON</h5>
                      <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedResource, null, 2))}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-auto max-h-96 border">
                      {JSON.stringify(selectedResource, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm">
            <p>Symphony AI FHIR Browser - HAPI FHIR Style Interface</p>
            <p className="text-gray-400 mt-1">
              Powered by FHIR R4 | Compatible with HAPI FHIR Server
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}