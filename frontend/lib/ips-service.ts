/**
 * IPS (International Patient Summary) Service
 * Based on https://build.fhir.org/ig/HL7/fhir-ips/StructureDefinition-Composition-uv-ips.html
 */

export interface IPSSummary {
  problems: any[]
  medications: any[]
  allergies: any[]
  vitals: any[]
  labs: any[]
  procedures: any[]
  encounters: any[]
  careGaps: string[]
  dataQualityNotes: string[]
}

export class IPSService {
  /**
   * Generate IPS-compliant Composition with narrative sections
   */
  static createIPSComposition(summary: IPSSummary, patientReference: string, authorDisplay: string): any {
    const now = new Date().toISOString()

    return {
      resourceType: 'Composition',
      status: 'final',
      type: {
        coding: [{
          system: 'http://loinc.org',
          code: '60591-5',
          display: 'Patient Summary Document'
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
        reference: patientReference
      },
      date: now,
      author: [{
        display: authorDisplay || 'Symphony AI Clinical Summary Generator'
      }],
      title: 'International Patient Summary - AI Generated',
      // IPS-compliant sections
      section: [
        this.createActiveProblemsSection(summary.problems),
        this.createMedicationSummarySection(summary.medications),
        this.createAllergiesIntolerancesSection(summary.allergies),
        this.createVitalSignsSection(summary.vitals),
        this.createDiagnosticResultsSection(summary.labs),
        this.createProceduresSection(summary.procedures),
        this.createCareTeamSection(summary.encounters),
        this.createCareGapsSection(summary.careGaps),
        this.createDataQualitySection(summary.dataQualityNotes)
      ].filter(section => section !== null)
    }
  }

  /**
   * Active Problems Section - Required in IPS
   */
  private static createActiveProblemsSection(problems: any[]): any {
    if (!problems || problems.length === 0) {
      return {
        title: 'Active Problems',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '11450-4',
            display: 'Problem list - Reported'
          }]
        },
        text: {
          status: 'generated',
          div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>No active problems documented.</p></div>'
        },
        emptyReason: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
            code: 'nilknown',
            display: 'Nil Known'
          }]
        }
      }
    }

    const narrativeHtml = this.generateProblemsNarrative(problems)

    return {
      title: 'Active Problems',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '11450-4',
          display: 'Problem list - Reported'
        }]
      },
      text: {
        status: 'generated',
        div: narrativeHtml
      }
    }
  }

  /**
   * Medication Summary Section - Required in IPS
   */
  private static createMedicationSummarySection(medications: any[]): any {
    if (!medications || medications.length === 0) {
      return {
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
          div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>No medications documented.</p></div>'
        },
        emptyReason: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
            code: 'nilknown',
            display: 'Nil Known'
          }]
        }
      }
    }

    const narrativeHtml = this.generateMedicationsNarrative(medications)

    return {
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
        div: narrativeHtml
      }
    }
  }

  /**
   * Allergies and Intolerances Section - Required in IPS
   */
  private static createAllergiesIntolerancesSection(allergies: any[]): any {
    if (!allergies || allergies.length === 0) {
      return {
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
          div: '<div xmlns="http://www.w3.org/1999/xhtml"><p>No known allergies or intolerances.</p></div>'
        },
        emptyReason: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/list-empty-reason',
            code: 'nilknown',
            display: 'Nil Known'
          }]
        }
      }
    }

    const narrativeHtml = this.generateAllergiesNarrative(allergies)

    return {
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
        div: narrativeHtml
      }
    }
  }

  /**
   * Vital Signs Section
   */
  private static createVitalSignsSection(vitals: any[]): any | null {
    if (!vitals || vitals.length === 0) return null

    const narrativeHtml = this.generateVitalsNarrative(vitals)

    return {
      title: 'Vital Signs',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '8716-3',
          display: 'Vital signs'
        }]
      },
      text: {
        status: 'generated',
        div: narrativeHtml
      }
    }
  }

  /**
   * Diagnostic Results Section
   */
  private static createDiagnosticResultsSection(labs: any[]): any | null {
    if (!labs || labs.length === 0) return null

    const narrativeHtml = this.generateLabsNarrative(labs)

    return {
      title: 'Diagnostic Results',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '30954-2',
          display: 'Relevant diagnostic tests/laboratory data Narrative'
        }]
      },
      text: {
        status: 'generated',
        div: narrativeHtml
      }
    }
  }

  /**
   * Procedures Section
   */
  private static createProceduresSection(procedures: any[]): any | null {
    if (!procedures || procedures.length === 0) return null

    const narrativeHtml = this.generateProceduresNarrative(procedures)

    return {
      title: 'History of Procedures',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '47519-4',
          display: 'History of Procedures Document'
        }]
      },
      text: {
        status: 'generated',
        div: narrativeHtml
      }
    }
  }

  /**
   * Care Team Section
   */
  private static createCareTeamSection(encounters: any[]): any | null {
    if (!encounters || encounters.length === 0) return null

    const narrativeHtml = this.generateEncountersNarrative(encounters)

    return {
      title: 'Care Team',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '85847-2',
          display: 'Care Team'
        }]
      },
      text: {
        status: 'generated',
        div: narrativeHtml
      }
    }
  }

  /**
   * Care Gaps Section (Extension)
   */
  private static createCareGapsSection(careGaps: string[]): any | null {
    if (!careGaps || careGaps.length === 0) return null

    const narrativeHtml = this.generateCareGapsNarrative(careGaps)

    return {
      title: 'Care Gaps and Recommendations',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '18776-5',
          display: 'Plan of care note'
        }]
      },
      text: {
        status: 'generated',
        div: narrativeHtml
      }
    }
  }

  /**
   * Data Quality Section (Extension)
   */
  private static createDataQualitySection(dataQualityNotes: string[]): any | null {
    if (!dataQualityNotes || dataQualityNotes.length === 0) return null

    const narrativeHtml = this.generateDataQualityNarrative(dataQualityNotes)

    return {
      title: 'Data Quality Notes',
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '85899-3',
          display: 'Data source'
        }]
      },
      text: {
        status: 'generated',
        div: narrativeHtml
      }
    }
  }

  // Narrative generation methods
  private static generateProblemsNarrative(problems: any[]): string {
    const rows = problems.map(problem =>
      `<tr>
        <td>${this.escapeHtml(problem.display)}</td>
        <td>${problem.onsetDate || 'Unknown'}</td>
        <td>${problem.codes?.map((c: any) => `${c.system}: ${c.code}`).join(', ') || ''}</td>
      </tr>`
    ).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Active Problems</h3>
      <table border="1">
        <thead>
          <tr><th>Problem</th><th>Onset Date</th><th>Codes</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`
  }

  private static generateMedicationsNarrative(medications: any[]): string {
    const rows = medications.map(med =>
      `<tr>
        <td>${this.escapeHtml(med.display)}</td>
        <td>${med.status || 'Unknown'}</td>
        <td>${med.codes?.map((c: any) => `${c.system}: ${c.code}`).join(', ') || ''}</td>
      </tr>`
    ).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Current Medications</h3>
      <table border="1">
        <thead>
          <tr><th>Medication</th><th>Status</th><th>Codes</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`
  }

  private static generateAllergiesNarrative(allergies: any[]): string {
    const rows = allergies.map(allergy =>
      `<tr>
        <td>${this.escapeHtml(allergy.display)}</td>
        <td>${allergy.onsetDate || 'Unknown'}</td>
        <td>${allergy.codes?.map((c: any) => `${c.system}: ${c.code}`).join(', ') || ''}</td>
      </tr>`
    ).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Known Allergies and Intolerances</h3>
      <table border="1">
        <thead>
          <tr><th>Allergen</th><th>Onset Date</th><th>Codes</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`
  }

  private static generateVitalsNarrative(vitals: any[]): string {
    const rows = vitals.map(vital =>
      `<tr>
        <td>${this.escapeHtml(vital.display)}</td>
        <td>${vital.value}</td>
        <td>${vital.date}</td>
      </tr>`
    ).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Recent Vital Signs</h3>
      <table border="1">
        <thead>
          <tr><th>Vital Sign</th><th>Value</th><th>Date</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`
  }

  private static generateLabsNarrative(labs: any[]): string {
    const rows = labs.map(lab =>
      `<tr>
        <td>${this.escapeHtml(lab.display)}</td>
        <td>${lab.value}</td>
        <td>${lab.date}</td>
      </tr>`
    ).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Recent Laboratory Results</h3>
      <table border="1">
        <thead>
          <tr><th>Test</th><th>Result</th><th>Date</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`
  }

  private static generateProceduresNarrative(procedures: any[]): string {
    const rows = procedures.map(proc =>
      `<tr>
        <td>${this.escapeHtml(proc.display)}</td>
        <td>${proc.onsetDate || 'Unknown'}</td>
        <td>${proc.codes?.map((c: any) => `${c.system}: ${c.code}`).join(', ') || ''}</td>
      </tr>`
    ).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Medical Procedures</h3>
      <table border="1">
        <thead>
          <tr><th>Procedure</th><th>Date</th><th>Codes</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`
  }

  private static generateEncountersNarrative(encounters: any[]): string {
    const rows = encounters.map(enc =>
      `<tr>
        <td>${this.escapeHtml(enc.display)}</td>
        <td>${enc.type || 'Unknown'}</td>
      </tr>`
    ).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Recent Healthcare Encounters</h3>
      <table border="1">
        <thead>
          <tr><th>Encounter</th><th>Type</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`
  }

  private static generateCareGapsNarrative(careGaps: string[]): string {
    const items = careGaps.map(gap => `<li>${this.escapeHtml(gap)}</li>`).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Identified Care Gaps and Recommendations</h3>
      <ul>
        ${items}
      </ul>
      <p><em>These recommendations are generated by AI analysis and should be reviewed by healthcare providers.</em></p>
    </div>`
  }

  private static generateDataQualityNarrative(dataQualityNotes: string[]): string {
    const items = dataQualityNotes.map(note => `<li>${this.escapeHtml(note)}</li>`).join('')

    return `<div xmlns="http://www.w3.org/1999/xhtml">
      <h3>Data Quality Assessment</h3>
      <ul>
        ${items}
      </ul>
      <p><em>This summary is based on available FHIR data and may not represent the complete clinical picture.</em></p>
    </div>`
  }

  private static escapeHtml(text: string): string {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}