import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Demo materialization response
    return NextResponse.json({
      message: "Resources successfully created in FHIR server (Demo Mode)",
      compositionId: `Composition/demo-${Date.now()}`,
      listIds: [
        `List/problems-${Date.now()}`,
        `List/medications-${Date.now()}`,
        `List/allergies-${Date.now()}`
      ],
      documentReferenceId: `DocumentReference/demo-${Date.now()}`,
      provenanceId: `Provenance/demo-${Date.now()}`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to materialize summary' },
      { status: 500 }
    )
  }
}