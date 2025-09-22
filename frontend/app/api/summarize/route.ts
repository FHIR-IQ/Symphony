import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Demo summary generation
    const summary = {
      problems: [
        {
          display: "Type 2 Diabetes Mellitus",
          codes: [{ system: "ICD-10", code: "E11.9" }],
          provenance: "Condition/demo-1",
          onsetDate: "2018-03-15"
        },
        {
          display: "Essential Hypertension",
          codes: [{ system: "ICD-10", code: "I10" }],
          provenance: "Condition/demo-2",
          onsetDate: "2019-06-22"
        },
        {
          display: "Hyperlipidemia",
          codes: [{ system: "ICD-10", code: "E78.5" }],
          provenance: "Condition/demo-3",
          onsetDate: "2020-01-10"
        }
      ],
      medications: [
        {
          display: "Metformin 1000mg twice daily",
          codes: [{ system: "RxNorm", code: "6809" }],
          status: "active",
          provenance: "MedicationRequest/demo-1"
        },
        {
          display: "Lisinopril 10mg once daily",
          codes: [{ system: "RxNorm", code: "29046" }],
          status: "active",
          provenance: "MedicationRequest/demo-2"
        },
        {
          display: "Atorvastatin 40mg once daily",
          codes: [{ system: "RxNorm", code: "83367" }],
          status: "active",
          provenance: "MedicationRequest/demo-3"
        }
      ],
      allergies: [
        {
          display: "Penicillin - Rash",
          codes: [{ system: "RxNorm", code: "70618" }],
          provenance: "AllergyIntolerance/demo-1",
          onsetDate: "1995-04-12"
        }
      ],
      vitals: [
        {
          display: "Blood Pressure",
          value: "132/84 mmHg",
          date: "2024-01-15",
          provenance: "Observation/demo-bp-1"
        },
        {
          display: "Heart Rate",
          value: "78 bpm",
          date: "2024-01-15",
          provenance: "Observation/demo-hr-1"
        },
        {
          display: "BMI",
          value: "28.3 kg/m²",
          date: "2024-01-15",
          provenance: "Observation/demo-bmi-1"
        }
      ],
      labs: [
        {
          display: "Hemoglobin A1c",
          value: "7.2%",
          date: "2024-01-10",
          provenance: "Observation/demo-lab-1"
        },
        {
          display: "LDL Cholesterol",
          value: "95 mg/dL",
          date: "2024-01-10",
          provenance: "Observation/demo-lab-2"
        },
        {
          display: "Creatinine",
          value: "0.9 mg/dL",
          date: "2024-01-10",
          provenance: "Observation/demo-lab-3"
        }
      ],
      procedures: [
        {
          display: "Colonoscopy",
          codes: [{ system: "CPT", code: "45378" }],
          provenance: "Procedure/demo-1",
          onsetDate: "2023-06-15"
        },
        {
          display: "Annual Diabetic Eye Exam",
          codes: [{ system: "CPT", code: "92014" }],
          provenance: "Procedure/demo-2",
          onsetDate: "2023-11-20"
        }
      ],
      encounters: [
        {
          display: "Office Visit - Diabetes Follow-up",
          type: "ambulatory",
          provenance: "Encounter/demo-1"
        },
        {
          display: "Annual Physical Exam",
          type: "ambulatory",
          provenance: "Encounter/demo-2"
        }
      ],
      careGaps: [
        "Diabetic foot exam overdue (last exam > 12 months ago)",
        "Pneumococcal vaccine recommended for diabetic patients",
        "Nephropathy screening due"
      ],
      dataQualityNotes: [
        "Complete medication history available from 2020 onwards",
        "Lab results comprehensive for the past 2 years",
        "Some historical procedures may be missing"
      ]
    }

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}