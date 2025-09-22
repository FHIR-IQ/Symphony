import { NextRequest, NextResponse } from 'next/server'
import { createServerFHIRClient } from '../../../lib/fhir-client'
import { IPSService } from '../../../lib/ips-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { summaryJSON, method, authorDisplay, docRefTags, sourceBundleRef } = body

    const fhirClient = createServerFHIRClient()

    // Extract patient reference from source bundle
    const patientReference = sourceBundleRef?.replace('bundle-', 'Patient/') || 'Patient/unknown'

    // Create IPS-compliant Composition with proper narratives
    const composition = IPSService.createIPSComposition(
      summaryJSON,
      patientReference,
      authorDisplay || 'Symphony AI Clinical Summary Generator'
    )

    const createdComposition = await fhirClient.createResource(composition)

    // Create DocumentReference
    const documentReference = {
      resourceType: 'DocumentReference',
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

    const createdDocRef = await fhirClient.createResource(documentReference)

    return NextResponse.json({
      message: "Resources successfully created in FHIR server",
      compositionId: createdComposition.id,
      documentReferenceId: createdDocRef.id,
      listIds: [], // Could create List resources for each section
      provenanceId: null // Could create Provenance resource
    })
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