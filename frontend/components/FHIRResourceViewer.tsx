'use client';

import React, { useState, useEffect } from 'react';

interface FHIRResourceViewerProps {
  resourceType?: string;
  resourceId?: string;
  resource?: any;
  serverUrl?: string;
}

export default function FHIRResourceViewer({
  resourceType,
  resourceId,
  resource: initialResource,
  serverUrl = process.env.NEXT_PUBLIC_HAPI_SERVER_URL || 'https://symphony-hapi.railway.app'
}: FHIRResourceViewerProps) {
  const [resource, setResource] = useState<any>(initialResource);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const [searchQuery, setSearchQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const basePath = process.env.NEXT_PUBLIC_HAPI_BASE_PATH || '/fhir';

  useEffect(() => {
    if (resourceType && resourceId && !initialResource) {
      fetchResource();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, resourceId]);

  const fetchResource = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${serverUrl}${basePath}/${resourceType}/${resourceId}`,
        {
          headers: {
            'Accept': 'application/fhir+json',
            'Content-Type': 'application/fhir+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResource(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch resource');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (resource) {
      navigator.clipboard.writeText(JSON.stringify(resource, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const downloadAsFile = () => {
    if (resource) {
      const blob = new Blob([JSON.stringify(resource, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resource.resourceType || 'fhir'}_${resource.id || 'resource'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const renderValue = (value: any, path: string = 'root', depth: number = 0): JSX.Element => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-blue-600">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-purple-600">{value}</span>;
    }

    if (typeof value === 'string') {
      // Check if it's a URL
      if (value.match(/^https?:\/\//)) {
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            &quot;{value}&quot;
          </a>
        );
      }
      // Check if it's a date
      if (value.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/)) {
        return <span className="text-green-600">&quot;{value}&quot;</span>;
      }
      return <span className="text-red-600">&quot;{value}&quot;</span>;
    }

    if (Array.isArray(value)) {
      const isExpanded = expanded.has(path);
      return (
        <div className="inline">
          <button
            onClick={() => toggleExpand(path)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            [{isExpanded ? '−' : '+'}]
          </button>
          <span className="text-gray-500 ml-1">Array({value.length})</span>
          {isExpanded && (
            <div className="ml-4 mt-1">
              {value.map((item, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">{index}:</span>
                  {renderValue(item, `${path}.${index}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expanded.has(path);
      const keys = Object.keys(value);

      return (
        <div className="inline">
          <button
            onClick={() => toggleExpand(path)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {'{'}
            {!isExpanded && '...'}
            {!isExpanded && '}'}
          </button>
          {isExpanded && (
            <>
              <div className="ml-4 mt-1">
                {keys.map((key) => {
                  const keyPath = `${path}.${key}`;
                  const shouldHighlight = searchQuery &&
                    (key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     JSON.stringify(value[key]).toLowerCase().includes(searchQuery.toLowerCase()));

                  return (
                    <div
                      key={key}
                      className={`flex items-start ${shouldHighlight ? 'bg-yellow-100' : ''}`}
                    >
                      <span className="text-blue-700 mr-2">&quot;{key}&quot;:</span>
                      {renderValue(value[key], keyPath, depth + 1)}
                    </div>
                  );
                })}
              </div>
              <span className="text-gray-500">{'}'}</span>
            </>
          )}
        </div>
      );
    }

    return <span className="text-gray-600">{JSON.stringify(value)}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchResource}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No FHIR resource to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            FHIR Resource Viewer
            {resource.resourceType && (
              <span className="ml-2 text-blue-600">{resource.resourceType}</span>
            )}
            {resource.id && (
              <span className="ml-2 text-gray-500">#{resource.id}</span>
            )}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className={`px-3 py-1 text-sm rounded ${
                copySuccess
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copySuccess ? 'Copied!' : 'Copy JSON'}
            </button>
            <button
              onClick={downloadAsFile}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
            >
              Download
            </button>
            <button
              onClick={() => setExpanded(new Set(['root']))}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
            >
              Collapse All
            </button>
            <button
              onClick={() => {
                const allPaths = new Set<string>();
                const traverse = (obj: any, path: string) => {
                  allPaths.add(path);
                  if (typeof obj === 'object' && obj !== null) {
                    Object.keys(obj).forEach(key => {
                      traverse(obj[key], `${path}.${key}`);
                    });
                  }
                };
                traverse(resource, 'root');
                setExpanded(allPaths);
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
            >
              Expand All
            </button>
          </div>
        </div>
        <div className="mt-2">
          <input
            type="text"
            placeholder="Search in resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-4 font-mono text-sm overflow-auto max-h-[600px]">
        {renderValue(resource, 'root')}
      </div>

      {serverUrl && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
          <p className="text-xs text-gray-500">
            Server: <span className="font-mono">{serverUrl}{basePath}</span>
          </p>
        </div>
      )}
    </div>
  );
}