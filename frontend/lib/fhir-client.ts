/**
 * FHIR Client utilities for connecting to HAPI server
 */

export interface FHIRResource {
  resourceType: string
  id?: string
  [key: string]: any
}

export interface Bundle {
  resourceType: 'Bundle'
  id?: string
  type: string
  entry?: Array<{
    resource: FHIRResource
    fullUrl?: string
  }>
  total?: number
}

export class FHIRClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
  }

  async fetchResource(resourceType: string, id: string): Promise<FHIRResource> {
    const url = `${this.baseUrl}/${resourceType}/${id}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${resourceType}/${id}: ${response.statusText}`)
    }

    return response.json()
  }

  async searchResources(resourceType: string, params: Record<string, string> = {}): Promise<Bundle> {
    const searchParams = new URLSearchParams(params)
    const url = `${this.baseUrl}/${resourceType}?${searchParams.toString()}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to search ${resourceType}: ${response.statusText}`)
    }

    return response.json()
  }

  async createResource(resource: FHIRResource): Promise<FHIRResource> {
    const url = `${this.baseUrl}/${resource.resourceType}`

    console.log(`Creating ${resource.resourceType} at ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      },
      body: JSON.stringify(resource)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to create ${resource.resourceType}:`, response.status, errorText)
      throw new Error(`Failed to create ${resource.resourceType}: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async getPatientEverything(patientId: string): Promise<Bundle> {
    const url = `${this.baseUrl}/Patient/${patientId}/$everything`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get patient everything: ${response.statusText}`)
    }

    return response.json()
  }
}

// Server-side instance (for API routes)
export function createServerFHIRClient(): FHIRClient {
  // Use Railway proxy for write operations, fallback to public server for reads
  const writeUrl = process.env.NEXT_PUBLIC_RAILWAY_FHIR_URL || process.env.HAPI_BASE_URL || 'https://hapi.fhir.org/baseR4'
  return new FHIRClient(writeUrl.includes('railway') ? `${writeUrl}/fhir` : writeUrl)
}

// Client-side instance (for frontend)
export function createClientFHIRClient(): FHIRClient {
  const baseUrl = process.env.NEXT_PUBLIC_HAPI_BASE_URL || 'https://hapi.fhir.org/baseR4'
  return new FHIRClient(baseUrl)
}