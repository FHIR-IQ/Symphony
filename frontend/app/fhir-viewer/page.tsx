'use client';

import React, { useState } from 'react';
import FHIRResourceViewer from '@/components/FHIRResourceViewer';

export default function FHIRViewerPage() {
  const [resourceType, setResourceType] = useState('Patient');
  const [resourceId, setResourceId] = useState('');
  const [searchParams, setSearchParams] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  const serverUrl = process.env.NEXT_PUBLIC_HAPI_SERVER_URL || 'https://hapi.fhir.org';
  const basePath = process.env.NEXT_PUBLIC_HAPI_BASE_PATH || '/baseR4';

  const commonResourceTypes = [
    'Patient',
    'Practitioner',
    'Organization',
    'Encounter',
    'Observation',
    'Condition',
    'Procedure',
    'MedicationRequest',
    'AllergyIntolerance',
    'Immunization',
    'CarePlan',
    'Goal',
    'Bundle',
    'Composition'
  ];

  const fetchResource = async () => {
    if (!resourceId) {
      setError('Please enter a resource ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${serverUrl}${basePath}/${resourceType}/${resourceId}`,
        {
          headers: {
            'Accept': 'application/fhir+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedResource(data);
      setResources([data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resource');
    } finally {
      setLoading(false);
    }
  };

  const searchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryString = searchParams ? `?${searchParams}` : '';
      const response = await fetch(
        `${serverUrl}${basePath}/${resourceType}${queryString}`,
        {
          headers: {
            'Accept': 'application/fhir+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search resources: ${response.status} ${response.statusText}`);
      }

      const bundle = await response.json();
      if (bundle.entry && bundle.entry.length > 0) {
        const resourceList = bundle.entry.map((entry: any) => entry.resource);
        setResources(resourceList);
        setSelectedResource(resourceList[0]);
      } else {
        setResources([]);
        setSelectedResource(null);
        setError('No resources found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search resources');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${serverUrl}${basePath}/metadata`,
        {
          headers: {
            'Accept': 'application/fhir+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Server connection failed: ${response.status} ${response.statusText}`);
      }

      const metadata = await response.json();
      setSelectedResource(metadata);
      setResources([metadata]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to FHIR server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">FHIR Resource Viewer</h1>

          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Server URL:</strong> {serverUrl}{basePath}
            </p>
            <button
              onClick={testConnection}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Connection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Fetch Single Resource</h2>
              <div className="space-y-4">
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
                    Resource ID
                  </label>
                  <input
                    type="text"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                    placeholder="e.g., example-patient-123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={fetchResource}
                  disabled={loading || !resourceId}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Fetch Resource'}
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Search Resources</h2>
              <div className="space-y-4">
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
                    placeholder="e.g., name=Smith&gender=male"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use FHIR search syntax (e.g., _count=10, _sort=-date)
                  </p>
                </div>

                <button
                  onClick={searchResources}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Searching...' : 'Search Resources'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {resources.length > 1 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Search Results ({resources.length} resources)</h2>
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedResource(resource)}
                  className={`w-full text-left px-4 py-2 rounded border ${
                    selectedResource === resource
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{resource.resourceType}</span>
                    <span className="text-gray-500">{resource.id}</span>
                  </div>
                  {resource.name && (
                    <div className="text-sm text-gray-600">
                      {Array.isArray(resource.name)
                        ? `${resource.name[0].given?.join(' ')} ${resource.name[0].family}`
                        : resource.name}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedResource && (
          <div className="bg-white rounded-lg shadow-md">
            <FHIRResourceViewer resource={selectedResource} serverUrl={serverUrl} />
          </div>
        )}
      </div>
    </div>
  );
}