#!/usr/bin/env python3
"""
Test script to verify GitHub Secrets configuration
This script simulates what the GitHub Actions workflow will do
"""

import os
import sys

def test_api_key_configuration():
    """Test API key configuration similar to GitHub Actions"""
    print("Testing API key configuration...")

    # Test ANTHROPIC_API_KEY
    anthropic_key = os.getenv('ANTHROPIC_API_KEY')

    if not anthropic_key:
        print("WARNING: ANTHROPIC_API_KEY not found in environment")
        print("This is expected for local testing")
        print("In GitHub Actions, this will be provided via secrets")
        return False

    if len(anthropic_key) < 20:
        print("ERROR: ANTHROPIC_API_KEY appears too short")
        return False

    if not anthropic_key.startswith('sk-ant-api03-'):
        print("ERROR: ANTHROPIC_API_KEY doesn't match expected format")
        return False

    print("SUCCESS: ANTHROPIC_API_KEY is configured correctly")
    print(f"Key length: {len(anthropic_key)} characters")
    print(f"Key prefix: {anthropic_key[:15]}...")
    return True

def test_imports():
    """Test that required imports work"""
    print("\nTesting imports...")

    try:
        from app.adapters.llm_anthropic import AnthropicAdapter
        print("SUCCESS: AnthropicAdapter import working")
    except ImportError as e:
        print(f"ERROR: Cannot import AnthropicAdapter: {e}")
        return False

    try:
        import anthropic
        print("SUCCESS: Anthropic package available")
    except ImportError as e:
        print(f"ERROR: Anthropic package not available: {e}")
        return False

    return True

def test_adapter_creation():
    """Test adapter creation with environment variables"""
    print("\nTesting adapter creation...")

    try:
        from app.adapters.llm_anthropic import AnthropicAdapter

        # Test with environment variable
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key:
            adapter = AnthropicAdapter()
            print("SUCCESS: Adapter created with environment variable")
            return True
        else:
            print("INFO: No API key in environment, testing with mock key")
            adapter = AnthropicAdapter(api_key='test-key')
            print("SUCCESS: Adapter created with provided key")
            return True

    except Exception as e:
        print(f"ERROR: Failed to create adapter: {e}")
        return False

def main():
    """Main test function"""
    print("=== GitHub Secrets Configuration Test ===")
    print("This script tests the same configuration that GitHub Actions will use\n")

    # Run tests
    results = []
    results.append(test_imports())
    results.append(test_api_key_configuration())
    results.append(test_adapter_creation())

    # Summary
    print("\n=== Test Summary ===")
    success_count = sum(results)
    total_count = len(results)

    print(f"Tests passed: {success_count}/{total_count}")

    if success_count == total_count:
        print("SUCCESS: All tests passed!")
        print("\nGitHub Actions deployment should work correctly")
        sys.exit(0)
    else:
        print("WARNING: Some tests failed")
        print("\nFor local development:")
        print("1. Create .env file: cp .env.example .env")
        print("2. Add your API key to .env file")
        print("3. Set MODEL_PROVIDER=anthropic in .env")
        print("\nFor GitHub Actions:")
        print("1. Ensure ANTHROPIC_API_KEY is added to repository secrets")
        print("2. Check GitHub Actions workflow logs for any issues")
        sys.exit(1)

if __name__ == "__main__":
    main()