#!/usr/bin/env python3
"""
Security Check Script for Symphony

This script validates that API keys are properly secured and not exposed in version control.
Run this before committing code to ensure security best practices.
"""

import os
import sys
import re
import glob
from pathlib import Path

def check_gitignore():
    """Verify .gitignore contains security patterns."""
    gitignore_path = ".gitignore"

    if not os.path.exists(gitignore_path):
        return False, "No .gitignore file found"

    with open(gitignore_path, 'r') as f:
        content = f.read()

    required_patterns = [
        ".env",
        "*.env",
        "secrets/",
        "*_api_key.txt"
    ]

    missing = []
    for pattern in required_patterns:
        if pattern not in content:
            missing.append(pattern)

    if missing:
        return False, f"Missing .gitignore patterns: {missing}"

    return True, ".gitignore contains security patterns"

def scan_for_api_keys():
    """Scan for accidentally committed API keys."""
    dangerous_patterns = [
        r'sk-ant-api03-[a-zA-Z0-9_-]+',  # Anthropic keys
        r'sk-[a-zA-Z0-9]{48}',           # OpenAI keys
        r'AIza[a-zA-Z0-9_-]{35}',        # Google API keys
        r'ANTHROPIC_API_KEY\s*=\s*["\']?sk-',  # Anthropic in env
        r'OPENAI_API_KEY\s*=\s*["\']?sk-',     # OpenAI in env
        r'GOOGLE_API_KEY\s*=\s*["\']?AI',      # Google in env
    ]

    exclude_patterns = [
        '*.git*',
        'node_modules',
        '__pycache__',
        '*.pyc',
        '.env.example',  # Allow example file
        'README.md',     # Documentation with examples
        'SECURITY.md',   # Security documentation with examples
        'specifications' # Specification documents
    ]

    dangerous_files = []

    # Get all files except excluded
    for root, dirs, files in os.walk('.'):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if not any(d.startswith(ex.replace('*', '')) for ex in exclude_patterns)]

        for file in files:
            file_path = os.path.join(root, file)

            # Skip excluded files
            if any(file.endswith(ex.replace('*', '')) for ex in exclude_patterns):
                continue

            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                for pattern in dangerous_patterns:
                    if re.search(pattern, content):
                        dangerous_files.append({
                            'file': file_path,
                            'pattern': pattern
                        })
            except:
                continue  # Skip binary files

    return dangerous_files

def check_env_file():
    """Check if .env file exists and warn about security."""
    env_files = ['.env', '.env.local', '.env.production']
    found_env = []

    for env_file in env_files:
        if os.path.exists(env_file):
            found_env.append(env_file)

    return found_env

def main():
    """Run security checks."""
    print("SYMPHONY SECURITY CHECK")
    print("=" * 50)

    # Check .gitignore
    print("\n1. Checking .gitignore...")
    gitignore_ok, gitignore_msg = check_gitignore()
    if gitignore_ok:
        print(f"   SUCCESS: {gitignore_msg}")
    else:
        print(f"   FAIL: {gitignore_msg}")

    # Check for API keys in code
    print("\n2. Scanning for exposed API keys...")
    dangerous_files = scan_for_api_keys()
    if dangerous_files:
        print("   FAIL: Found potential API keys in code:")
        for item in dangerous_files:
            print(f"      - {item['file']}: {item['pattern']}")
        print("\n   SECURITY ALERT: Remove API keys from code immediately!")
        print("      1. Remove keys from files")
        print("      2. Use environment variables instead")
        print("      3. Consider rotating exposed keys")
    else:
        print("   SUCCESS: No API keys found in code")

    # Check for .env files
    print("\n3. Checking environment files...")
    env_files = check_env_file()
    if env_files:
        print(f"   WARNING: Found environment files: {env_files}")
        print("      Make sure these are in .gitignore!")
    else:
        print("   INFO: No .env files found (create .env from .env.example)")

    # Check if we're in a git repo
    print("\n4. Checking git status...")
    if os.path.exists('.git'):
        print("   SUCCESS: Git repository detected")

        # Check if .env files are tracked
        import subprocess
        try:
            result = subprocess.run(['git', 'ls-files', '*.env'],
                                  capture_output=True, text=True)
            if result.stdout.strip():
                tracked_env = result.stdout.strip().split('\n')
                print(f"   FAIL: Environment files tracked by git: {tracked_env}")
                print("      Run: git rm --cached <file> to untrack")
            else:
                print("   SUCCESS: No .env files tracked by git")
        except:
            print("   WARNING: Could not check git status")
    else:
        print("   WARNING: Not a git repository")

    # Summary
    print("\n" + "=" * 50)
    if dangerous_files:
        print("FAIL: SECURITY ISSUES FOUND - Fix before committing!")
        sys.exit(1)
    elif not gitignore_ok:
        print("WARNING: Security configuration needs improvement")
        sys.exit(1)
    else:
        print("PASS: Security check passed!")
        print("\nFor complete security guide, see SECURITY.md")
        sys.exit(0)

if __name__ == "__main__":
    main()