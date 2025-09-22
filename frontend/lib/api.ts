/**
 * API utility functions with demo mode support
 */

import { DEMO_MODE, createMockFetch } from './demo-data';

// Global fetch override for demo mode
if (typeof window !== 'undefined' && DEMO_MODE) {
  console.log('🎭 Demo mode enabled - using mock API responses');
  window.fetch = createMockFetch() as any;
}

export const apiRequest = async (endpoint: string, options?: RequestInit) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const url = DEMO_MODE ? endpoint : `${baseUrl}${endpoint}`;

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