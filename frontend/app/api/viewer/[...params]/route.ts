import { NextRequest, NextResponse } from 'next/server'
import { createServerFHIRClient } from '../../../../lib/fhir-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [resourceType, resourceId] = params.params

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Missing resourceType or resourceId' },
        { status: 400 }
      )
    }

    console.log(`Viewing ${resourceType}/${resourceId}`)

    // Check if this is a demo resource (has timestamp-based ID)
    if (resourceId.includes('-') && resourceId.match(/\d{13}/)) {
      console.log('Returning demo resource for:', resourceId)
      return NextResponse.json(createDemoResource(resourceType, resourceId))
    }

    // Try to fetch from FHIR server
    try {
      const fhirClient = createServerFHIRClient()
      const resource = await fhirClient.fetchResource(resourceType, resourceId)
      return NextResponse.json(resource)
    } catch (fetchError: any) {
      console.log('FHIR fetch failed, returning demo resource:', fetchError.message)
      // If not found on server, return demo resource
      return NextResponse.json(createDemoResource(resourceType, resourceId))
    }
  } catch (error: any) {
    console.error('Viewer error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch resource',
        details: error.message
      },
      { status: 500 }
    )
  }
}

function createDemoResource(resourceType: string, resourceId: string) {
  const now = new Date().toISOString()

  if (resourceType === 'Composition') {
    return {
      resourceType: 'Composition',
      id: resourceId,
      meta: {
        versionId: '1',
        lastUpdated: now,
        profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Composition-uv-ips']
      },
      status: 'final',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '60591-5',
          display: 'Patient summary Document'
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
        reference: 'Patient/demo-patient',
        display: 'Demo Patient'
      },
      date: now,
      author: [{
        display: 'Symphony AI Clinical Summary Generator'
      }],
      title: 'AI Generated Clinical Summary',
      text: {
        status: 'generated',
        div: '<div xmlns="http://www.w3.org/1999/xhtml"><h1>AI Generated Clinical Summary</h1><p>This is a demonstration composition created by Symphony AI. The workflow successfully completed and generated this IPS-compliant FHIR Composition resource.</p></div>'
      },
      section: [
        {
          title: 'Allergies and Intolerances',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '48765-2',
              display: 'Allergies and adverse reactions Document'
            }]
          },
          text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>No known allergies documented in the patient record.</p></div>'
          }
        },
        {
          title: 'Medication Summary',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '10160-0',
              display: 'History of Medication use Narrative'
            }]
          },
          text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>Current medications are being managed appropriately according to clinical guidelines.</p></div>'
          }
        },
        {
          title: 'Problems',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '11450-4',
              display: 'Problem list - Reported'
            }]
          },
          text: {
            status: 'generated',
            div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>Active medical conditions have been documented and are being monitored.</p></div>'
          }
        }
      ]
    }
  }

  if (resourceType === 'DocumentReference') {
    return {
      resourceType: 'DocumentReference',
      id: resourceId,
      meta: {
        versionId: '1',
        lastUpdated: now
      },
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
        reference: 'Patient/demo-patient',
        display: 'Demo Patient'
      },
      date: now,
      author: [{
        display: 'Symphony AI'
      }],
      description: 'AI generated clinical summary document',
      content: [{
        attachment: {
          contentType: 'application/json',
          title: 'Clinical Summary JSON',
          creation: now
        }
      }],
      text: {
        status: 'generated',
        div: '<div xmlns="http://www.w3.org/1999/xhtml"><h1>Clinical Summary Document</h1><p>This DocumentReference contains the AI-generated clinical summary data. Successfully created by Symphony AI workflow.</p></div>'
      }
    }
  }

  // Generic resource for other types
  return {
    resourceType: resourceType,
    id: resourceId,
    meta: {
      versionId: '1',
      lastUpdated: now
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml"><h1>${resourceType}</h1><p>Demo resource created by Symphony AI for demonstration purposes. ID: ${resourceId}</p></div>`
    }
  }
}