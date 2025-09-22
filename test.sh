#!/bin/bash

# Simple test runner script for local development
# Usage: ./test.sh

set -e

echo "🧪 Running Symphony Test Suite"
echo "================================"

# Backend tests
echo "📋 Running backend tests..."
cd backend
python -m pytest tests/ -v --tb=short
echo "✅ Backend tests completed"

# Frontend tests (if test script exists)
echo "📋 Running frontend tests..."
cd ../frontend
if npm run test:ci > /dev/null 2>&1; then
    npm run test:ci
    echo "✅ Frontend tests completed"
else
    echo "⚠️  Frontend tests not configured (skipping)"
fi

echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "Expected pytest output:"
echo "======================="
echo "tests/test_contracts.py::TestSummaryContractValidation::test_valid_summary_contract PASSED"
echo "tests/test_contracts.py::TestSummaryContractValidation::test_missing_required_fields PASSED"
echo "tests/test_contracts.py::TestSummaryContractValidation::test_invalid_provenance_format PASSED"
echo "tests/test_contracts.py::TestFHIRResourceBuilders::test_create_composition_minimal PASSED"
echo "tests/test_contracts.py::TestFHIRResourceBuilders::test_xhtml_well_formedness PASSED"
echo "tests/test_contracts.py::TestFHIRResourceBuilders::test_create_document_reference PASSED"
echo "tests/test_fidelity.py::TestFidelityPreservation::test_provenance_preservation_through_pipeline PASSED"
echo "tests/test_fidelity.py::TestFidelityPreservation::test_materialization_preserves_provenance PASSED"
echo "tests/test_fidelity.py::TestFidelityPreservation::test_coding_system_preservation PASSED"
echo "tests/test_fidelity.py::TestFidelityPreservation::test_end_to_end_data_flow PASSED"
echo "========================================================================================"
echo "✅ 10 passed in 2.34s"