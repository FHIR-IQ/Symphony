import { NextRequest, NextResponse } from 'next/server'
import { createServerFHIRClient } from '../../../lib/fhir-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { summaryJSON, method, authorDisplay, docRefTags, sourceBundleRef } = body

    const fhirClient = createServerFHIRClient()

    // Create a Composition resource
    const composition = {
      resourceType: 'Composition',
      status: 'final',
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
      title: 'AI Generated Clinical Summary',
      section: [
        {
          title: 'Problems',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '11450-4',
              display: 'Problem list'
            }]
          },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${
              summaryJSON.problems?.map((p: any) => `<p>${p.display}</p>`).join('') || 'No problems documented'
            }</div>`
          }
        },
        {
          title: 'Medications',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '10160-0',
              display: 'History of medication use'
            }]
          },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${
              summaryJSON.medications?.map((m: any) => `<p>${m.display}</p>`).join('') || 'No medications documented'
            }</div>`
          }
        }
      ]
    }

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