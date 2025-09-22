import { NextRequest, NextResponse } from 'next/server'
import { createServerFHIRClient } from '../../../lib/fhir-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [resourceType, resourceId] = params.params

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Resource type and ID are required' },
        { status: 400 }
      )
    }

    const fhirClient = createServerFHIRClient()
    const resource = await fhirClient.fetchResource(resourceType, resourceId)

    return NextResponse.json(resource)
  } catch (error: any) {
    console.error('FHIR viewer error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch resource',
        details: error.message,
        resourceType: params.params[0],
        resourceId: params.params[1]
      },
      { status: 500 }
    )
  }
}