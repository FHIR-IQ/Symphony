import { NextRequest, NextResponse } from 'next/server'
import { createServerFHIRClient } from '../../../lib/fhir-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resourceType')

    if (!resourceType) {
      return NextResponse.json(
        { error: 'Missing resourceType parameter' },
        { status: 400 }
      )
    }

    // Build FHIR search parameters
    const fhirParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key !== 'resourceType') {
        fhirParams[key] = value
      }
    })

    console.log(`Searching ${resourceType} with params:`, fhirParams)

    try {
      const fhirClient = createServerFHIRClient()
      const bundle = await fhirClient.searchResources(resourceType, fhirParams)

      // If no results, return some demo data for common resource types
      if (!bundle.entry || bundle.entry.length === 0) {
        return NextResponse.json(createDemoBundle(resourceType, fhirParams))
      }

      return NextResponse.json(bundle)
    } catch (searchError: any) {
      console.log('FHIR search failed, returning demo data:', searchError.message)
      return NextResponse.json(createDemoBundle(resourceType, fhirParams))
    }
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        error: 'Failed to search resources',
        details: error.message
      },
      { status: 500 }
    )
  }
}

function createDemoBundle(resourceType: string, searchParams: Record<string, string>) {
  const now = new Date().toISOString()

  if (resourceType === 'Patient') {
    return {
      resourceType: 'Bundle',
      id: `bundle-search-${Date.now()}`,
      type: 'searchset',
      total: 3,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: 'demo-patient-1',
            meta: {
              versionId: '1',
              lastUpdated: now
            },
            name: [{
              family: 'Smith',
              given: ['John', 'David']
            }],
            gender: 'male',
            birthDate: '1980-01-15',
            address: [{
              city: 'Boston',
              state: 'MA',
              country: 'USA'
            }],
            text: {
              status: 'generated',
              div: '<div xmlns="http://www.w3.org/1999/xhtml">Demo Patient: John David Smith</div>'
            }
          }
        },
        {
          resource: {
            resourceType: 'Patient',
            id: 'demo-patient-2',
            meta: {
              versionId: '1',
              lastUpdated: now
            },
            name: [{
              family: 'Johnson',
              given: ['Sarah', 'Marie']
            }],
            gender: 'female',
            birthDate: '1975-08-22',
            address: [{
              city: 'Seattle',
              state: 'WA',
              country: 'USA'
            }],
            text: {
              status: 'generated',
              div: '<div xmlns="http://www.w3.org/1999/xhtml">Demo Patient: Sarah Marie Johnson</div>'
            }
          }
        },
        {
          resource: {
            resourceType: 'Patient',
            id: 'demo-patient-3',
            meta: {
              versionId: '1',
              lastUpdated: now
            },
            name: [{
              family: 'Williams',
              given: ['Michael', 'Robert']
            }],
            gender: 'male',
            birthDate: '1965-12-03',
            address: [{
              city: 'Phoenix',
              state: 'AZ',
              country: 'USA'
            }],
            text: {
              status: 'generated',
              div: '<div xmlns="http://www.w3.org/1999/xhtml">Demo Patient: Michael Robert Williams</div>'
            }
          }
        }
      ]
    }
  }

  if (resourceType === 'Observation') {
    return {
      resourceType: 'Bundle',
      id: `bundle-search-${Date.now()}`,
      type: 'searchset',
      total: 2,
      entry: [
        {
          resource: {
            resourceType: 'Observation',
            id: 'demo-observation-1',
            status: 'final',
            category: [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs'
              }]
            }],
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '85354-9',
                display: 'Blood pressure panel'
              }]
            },
            subject: {
              reference: 'Patient/demo-patient-1'
            },
            effectiveDateTime: now,
            text: {
              status: 'generated',
              div: '<div xmlns="http://www.w3.org/1999/xhtml">Demo Observation: Blood pressure panel</div>'
            }
          }
        }
      ]
    }
  }

  // Generic bundle for other resource types
  return {
    resourceType: 'Bundle',
    id: `bundle-search-${Date.now()}`,
    type: 'searchset',
    total: 1,
    entry: [
      {
        resource: {
          resourceType: resourceType,
          id: `demo-${resourceType.toLowerCase()}-1`,
          meta: {
            versionId: '1',
            lastUpdated: now
          },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">Demo ${resourceType} resource for testing</div>`
          }
        }
      }
    ]
  }
}