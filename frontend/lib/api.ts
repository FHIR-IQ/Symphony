/**
 * API utility functions for Symphony
 */

export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  // Use relative URLs that will work with Next.js API routes
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

export const healthCheck = () => apiRequest('/api/health');

export const ingestData = (payload: any) =>
  apiRequest('/api/ingest', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const generateSummary = (payload: any) =>
  apiRequest('/api/summarize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const materializeSummary = (payload: any) =>
  apiRequest('/api/materialize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const exportPatient = (patientId: string) =>
  apiRequest(`/api/export/${patientId}`);

export const viewResource = (resourceType: string, resourceId: string) =>
  apiRequest(`/api/viewer/${resourceType}/${resourceId}`);