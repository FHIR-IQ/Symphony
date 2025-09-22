/**
 * Demo data for Vercel deployment when backend is not available
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const mockApiResponses = {
  health: { status: "ok" },

  ingest: {
    message: "Successfully ingested patient data (DEMO)",
    patientReference: "Patient/demo-592912",
    resourceCounts: {
      Patient: 1,
      Condition: 3,
      Observation: 15,
      MedicationRequest: 4,
      AllergyIntolerance: 2,
      Procedure: 1,
      Encounter: 6
    },
    bundleId: "Bundle/demo-bundle-123"
  },

  summarize: {
    problems: [
      {
        display: "Type 2 Diabetes Mellitus",
        codes: [
          {
            system: "http://snomed.info/sct",
            code: "44054006",
            display: "Type 2 diabetes mellitus"
          }
        ],
        provenance: "Condition/demo-dm-123",
        onsetDate: "2020-01-15"
      },
      {
        display: "Essential Hypertension",
        codes: [
          {
            system: "http://snomed.info/sct",
            code: "59621000",
            display: "Essential hypertension"
          }
        ],
        provenance: "Condition/demo-htn-456"
      }
    ],
    medications: [
      {
        display: "Metformin 500mg twice daily",
        codes: [
          {
            system: "http://www.nlm.nih.gov/research/umls/rxnorm",
            code: "860975",
            display: "metformin hydrochloride 500 MG Oral Tablet"
          }
        ],
        provenance: "MedicationRequest/demo-met-789",
        status: "active"
      },
      {
        display: "Lisinopril 10mg daily",
        codes: [
          {
            system: "http://www.nlm.nih.gov/research/umls/rxnorm",
            code: "314077",
            display: "lisinopril 10 MG Oral Tablet"
          }
        ],
        provenance: "MedicationRequest/demo-lis-101",
        status: "active"
      }
    ],
    allergies: [
      {
        display: "Penicillin allergy",
        codes: [
          {
            system: "http://snomed.info/sct",
            code: "294505008",
            display: "Penicillin allergy"
          }
        ],
        provenance: "AllergyIntolerance/demo-pcn-202"
      }
    ],
    vitals: [
      {
        display: "Blood Pressure",
        value: "142/88 mmHg",
        codes: [
          {
            system: "http://loinc.org",
            code: "85354-9",
            display: "Blood pressure panel"
          }
        ],
        provenance: "Observation/demo-bp-303",
        date: "2024-01-15"
      },
      {
        display: "Body Weight",
        value: "85.2 kg",
        codes: [
          {
            system: "http://loinc.org",
            code: "29463-7",
            display: "Body weight"
          }
        ],
        provenance: "Observation/demo-wt-404"
      }
    ],
    labs: [
      {
        display: "HbA1c",
        value: "7.2%",
        codes: [
          {
            system: "http://loinc.org",
            code: "4548-4",
            display: "Hemoglobin A1c/Hemoglobin.total in Blood"
          }
        ],
        provenance: "Observation/demo-a1c-505",
        date: "2024-01-10"
      },
      {
        display: "Creatinine",
        value: "1.1 mg/dL",
        codes: [
          {
            system: "http://loinc.org",
            code: "2160-0",
            display: "Creatinine [Mass/volume] in Serum or Plasma"
          }
        ],
        provenance: "Observation/demo-cr-606"
      }
    ],
    procedures: [
      {
        display: "Annual diabetic eye exam",
        codes: [
          {
            system: "http://snomed.info/sct",
            code: "134395001",
            display: "Diabetic retinopathy screening"
          }
        ],
        provenance: "Procedure/demo-eye-707",
        onsetDate: "2023-12-15"
      }
    ],
    encounters: [
      {
        display: "Annual wellness visit",
        type: "ambulatory",
        provenance: "Encounter/demo-enc-808"
      },
      {
        display: "Diabetes follow-up",
        type: "ambulatory",
        provenance: "Encounter/demo-enc-909"
      }
    ],
    careGaps: [
      "Overdue for annual foot exam (diabetic neuropathy screening)",
      "Consider pneumococcal vaccination based on age",
      "Lipid panel due for cardiovascular risk assessment"
    ],
    dataQualityNotes: [
      "Recent vitals and labs available from last visit",
      "Medication adherence status documented",
      "Previous A1c trend shows improvement"
    ]
  },

  materialize: {
    message: "Successfully created FHIR resources (DEMO)",
    compositionId: "Composition/demo-comp-111",
    listIds: [
      "List/demo-problems-222",
      "List/demo-medications-333",
      "List/demo-allergies-444"
    ],
    documentReferenceId: "DocumentReference/demo-doc-555",
    provenanceId: "Provenance/demo-prov-666"
  },

  export: {
    bundle: {
      resourceType: "Bundle",
      id: "demo-export-bundle",
      type: "collection",
      timestamp: "2024-01-20T10:00:00Z",
      total: 8,
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "demo-592912",
            name: [{ family: "Demo", given: ["Patient"] }]
          }
        }
      ]
    },
    resourceCount: 8,
    patientId: "Patient/demo-592912"
  }
};

export function createMockFetch() {
  return async (url: string, options?: RequestInit) => {
    console.log(`[DEMO MODE] Mock API call to: ${url}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    if (url.includes('/api/health')) {
      return {
        ok: true,
        json: async () => mockApiResponses.health
      };
    }

    if (url.includes('/api/ingest')) {
      return {
        ok: true,
        json: async () => mockApiResponses.ingest
      };
    }

    if (url.includes('/api/summarize')) {
      return {
        ok: true,
        json: async () => mockApiResponses.summarize
      };
    }

    if (url.includes('/api/materialize')) {
      return {
        ok: true,
        json: async () => mockApiResponses.materialize
      };
    }

    if (url.includes('/api/export')) {
      return {
        ok: true,
        json: async () => mockApiResponses.export
      };
    }

    if (url.includes('/api/viewer')) {
      return {
        ok: true,
        json: async () => ({
          resourceType: "Composition",
          id: "demo-resource",
          status: "final",
          type: { text: "Clinical Summary" },
          title: "Demo Clinical Summary"
        })
      };
    }

    // Default mock response
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: "Demo endpoint not implemented" })
    };
  };
}