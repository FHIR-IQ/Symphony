import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Demo response - in production, this would connect to real FHIR server
    return NextResponse.json({
      message: `Successfully ingested patient data from ${body.sourceBaseUrl}`,
      patientReference: `Patient/${body.patientId}`,
      bundleId: `bundle-${Date.now()}`,
      resourceCounts: {
        Patient: 1,
        Condition: Math.floor(Math.random() * 5) + 3,
        Observation: Math.floor(Math.random() * 20) + 10,
        MedicationRequest: Math.floor(Math.random() * 10) + 5,
        AllergyIntolerance: Math.floor(Math.random() * 3) + 1,
        Procedure: Math.floor(Math.random() * 8) + 2,
        Encounter: Math.floor(Math.random() * 15) + 5
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to ingest data' },
      { status: 500 }
    )
  }
}