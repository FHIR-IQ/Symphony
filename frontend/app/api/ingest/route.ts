import { NextRequest, NextResponse } from 'next/server'
import { FHIRClient } from '../../../lib/fhir-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceBaseUrl, patientId, resources } = body

    // Create FHIR client for the source server
    const fhirClient = new FHIRClient(sourceBaseUrl)

    // Fetch patient everything bundle
    const bundle = await fhirClient.getPatientEverything(patientId)

    // Count resources by type
    const resourceCounts: Record<string, number> = {}
    bundle.entry?.forEach(entry => {
      const resourceType = entry.resource.resourceType
      resourceCounts[resourceType] = (resourceCounts[resourceType] || 0) + 1
    })

    return NextResponse.json({
      message: `Successfully ingested patient data from ${sourceBaseUrl}`,
      patientReference: `Patient/${patientId}`,
      bundleId: bundle.id || `bundle-${Date.now()}`,
      resourceCounts,
      patientData: bundle // Store the full patient data for summary generation
    })
  } catch (error: any) {
    console.error('Ingest error:', error)
    return NextResponse.json(
      {
        error: 'Failed to ingest data',
        details: error.message
      },
      { status: 500 }
    )
  }
}