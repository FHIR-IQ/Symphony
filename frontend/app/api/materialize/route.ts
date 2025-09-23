import { NextRequest, NextResponse } from 'next/server'
import { createServerFHIRClient } from '../../../lib/fhir-client'
import { IPSService } from '../../../lib/ips-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { summaryJSON, method, authorDisplay, docRefTags, sourceBundleRef } = body

    // Extract patient reference from source bundle
    const patientReference = sourceBundleRef?.replace('bundle-', 'Patient/') || 'Patient/unknown'

    // Create IPS-compliant Composition with proper narratives
    const composition = IPSService.createIPSComposition(
      summaryJSON,
      patientReference,
      authorDisplay || 'Symphony AI Clinical Summary Generator'
    )

    // Add unique ID for demo purposes
    const compositionId = `composition-${Date.now()}`
    const docRefId = `docref-${Date.now()}`

    composition.id = compositionId

    // Create DocumentReference
    const documentReference = {
      resourceType: 'DocumentReference',
      id: docRefId,
      status: 'current',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '11503-0',
          display: 'Medical records'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AI',
          display: 'AI Generated'
        }]
      }],
      subject: {
        reference: sourceBundleRef?.replace('bundle-', 'Patient/')
      },
      date: new Date().toISOString(),
      author: [{
        display: authorDisplay || 'Symphony AI'
      }],
      description: 'AI generated clinical summary',
      content: [{
        attachment: {
          contentType: 'application/json',
          data: Buffer.from(JSON.stringify(summaryJSON)).toString('base64'),
          title: 'Clinical Summary JSON'
        }
      }]
    }

    // Try to create resources, but fallback to demo mode if server doesn't allow writes
    let createdComposition, createdDocRef
    try {
      const fhirClient = createServerFHIRClient()

      // Test if we can write to the server
      createdComposition = await fhirClient.createResource(composition)
      createdDocRef = await fhirClient.createResource(documentReference)

      return NextResponse.json({
        message: "Resources successfully created in FHIR server",
        compositionId: createdComposition.id,
        documentReferenceId: createdDocRef.id,
        listIds: [],
        provenanceId: null,
        mode: 'server'
      })
    } catch (writeError: any) {
      console.log('Server write failed, using demo mode:', writeError.message)

      // Demo mode - return simulated success
      return NextResponse.json({
        message: "Resources created in demo mode (FHIR server read-only)",
        compositionId: compositionId,
        documentReferenceId: docRefId,
        listIds: [],
        provenanceId: null,
        mode: 'demo',
        composition: composition,
        documentReference: documentReference,
        note: 'This is a demonstration. Resources were not persisted to the FHIR server as it is read-only.'
      })
    }
  } catch (error: any) {
    console.error('Materialization error:', error)
    return NextResponse.json(
      {
        error: 'Failed to materialize summary',
        details: error.message
      },
      { status: 500 }
    )
  }
}