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
    let composition = IPSService.createIPSComposition(
      summaryJSON,
      patientReference,
      authorDisplay || 'Symphony AI Clinical Summary Generator'
    )

    // If method is composition-narrative, enhance with AI-generated narrative
    if (method === 'composition-narrative') {
      composition = await enhanceCompositionWithAINarrative(composition, summaryJSON)
    }

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

async function enhanceCompositionWithAINarrative(composition: any, summaryJSON: any): Promise<any> {
  // Generate AI narrative for overall summary
  const overallNarrative = generateOverallNarrative(summaryJSON)

  // Add overall narrative section to the beginning
  const narrativeSection = {
    title: 'AI Generated Clinical Summary',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '11503-0',
        display: 'Medical records'
      }]
    },
    text: {
      status: 'generated',
      div: `<div xmlns="http://www.w3.org/1999/xhtml">
        <h2>Clinical Summary</h2>
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
          <h3>🤖 AI-Generated Clinical Narrative</h3>
          ${overallNarrative}
        </div>
      </div>`
    }
  }

  // Enhance existing sections with AI narrative
  const enhancedSections = composition.section.map((section: any) => {
    if (section.title && section.text) {
      const aiInsights = generateSectionAINarrative(section.title, summaryJSON)
      if (aiInsights) {
        // Add AI insights to existing section
        const existingDiv = section.text.div
        const enhancedDiv = existingDiv.replace(
          '</div>',
          `<div style="background: #e8f4f8; padding: 10px; margin-top: 15px; border-radius: 5px;">
            <h4>💡 AI Clinical Insights</h4>
            ${aiInsights}
          </div></div>`
        )

        return {
          ...section,
          text: {
            ...section.text,
            div: enhancedDiv
          }
        }
      }
    }
    return section
  })

  // Return composition with narrative section first, then enhanced sections
  return {
    ...composition,
    title: 'International Patient Summary - AI Enhanced with Narrative',
    section: [narrativeSection, ...enhancedSections]
  }
}

function generateOverallNarrative(summaryJSON: any): string {
  const { problems, medications, allergies, vitals, labs, procedures, careGaps, dataQualityNotes } = summaryJSON

  let narrative = '<p>This comprehensive clinical summary has been generated using advanced AI analysis of the patient&apos;s FHIR data.</p>'

  // Patient overview
  const activeProblems = problems?.length || 0
  const activeMeds = medications?.length || 0
  const knownAllergies = allergies?.length || 0

  narrative += `<p><strong>Patient Overview:</strong> This patient has ${activeProblems} documented active problem${activeProblems !== 1 ? 's' : ''},
    ${activeMeds} current medication${activeMeds !== 1 ? 's' : ''}, and ${knownAllergies} known allerg${knownAllergies !== 1 ? 'ies' : 'y'}.</p>`

  // Clinical insights
  if (problems?.length > 0) {
    const primaryConditions = problems.slice(0, 3).map((p: any) => p.display).join(', ')
    narrative += `<p><strong>Primary Clinical Conditions:</strong> ${primaryConditions}</p>`
  }

  // Care coordination insights
  if (careGaps?.length > 0) {
    narrative += `<p><strong>Care Optimization:</strong> AI analysis has identified ${careGaps.length} potential care gap${careGaps.length !== 1 ? 's' : ''}
      and recommendation${careGaps.length !== 1 ? 's' : ''} for optimal patient care.</p>`
  }

  // Data quality insights
  if (dataQualityNotes?.length > 0) {
    narrative += `<p><strong>Data Quality Assessment:</strong> This summary is based on analysis of available FHIR resources with
      ${dataQualityNotes.length} data quality observation${dataQualityNotes.length !== 1 ? 's' : ''} noted.</p>`
  }

  narrative += '<p><em>This AI-generated narrative provides clinical context and insights to support healthcare decision-making. All recommendations should be validated by healthcare professionals.</em></p>'

  return narrative
}

function generateSectionAINarrative(sectionTitle: string, summaryJSON: any): string | null {
  const { problems, medications, allergies, vitals, labs, procedures, careGaps } = summaryJSON

  switch (sectionTitle) {
    case 'Active Problems':
      if (problems?.length > 0) {
        const chronicConditions = problems.filter((p: any) =>
          p.display?.toLowerCase().includes('diabetes') ||
          p.display?.toLowerCase().includes('hypertension') ||
          p.display?.toLowerCase().includes('chronic')
        ).length

        if (chronicConditions > 0) {
          return `<p>AI Analysis identifies ${chronicConditions} chronic condition${chronicConditions !== 1 ? 's' : ''}
            requiring ongoing management and monitoring. Consider coordinated care approach for optimal outcomes.</p>`
        }
      }
      break

    case 'Medication Summary':
      if (medications?.length > 0) {
        return `<p>Current medication regimen includes ${medications.length} active prescription${medications.length !== 1 ? 's' : ''}.
          AI analysis suggests reviewing medication adherence and potential interactions during clinical encounters.</p>`
      }
      break

    case 'Allergies and Intolerances':
      if (allergies?.length > 0) {
        return `<p>Patient has ${allergies.length} documented allerg${allergies.length !== 1 ? 'ies' : 'y'}.
          Ensure all prescribing decisions and procedures consider these contraindications.</p>`
      }
      break

    case 'Care Gaps and Recommendations':
      if (careGaps?.length > 0) {
        return `<p>AI care gap analysis has identified ${careGaps.length} opportunity${careGaps.length !== 1 ? 'ies' : 'y'}
          for enhanced patient care. Prioritize these recommendations based on clinical judgment and patient preferences.</p>`
      }
      break
  }

  return null
}