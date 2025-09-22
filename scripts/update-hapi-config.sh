#!/bin/bash

# Script to update Symphony configuration to use custom HAPI server
# Run this after deploying your custom HAPI FHIR server

set -e

echo "🔧 Updating Symphony Configuration for Custom HAPI Server"
echo "========================================================"

# Check if URL is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <HAPI_SERVER_URL>"
    echo "Example: $0 https://symphony-hapi.railway.app"
    exit 1
fi

HAPI_SERVER_URL=$1
HAPI_API_URL="${HAPI_SERVER_URL}/fhir"

echo "📍 HAPI Server URL: $HAPI_SERVER_URL"
echo "📍 HAPI API URL: $HAPI_API_URL"

# Update frontend environment file
echo "📝 Updating frontend/.env.local..."

cat > frontend/.env.local << EOF
# Custom HAPI FHIR Server Configuration
NEXT_PUBLIC_HAPI_BASE_URL=${HAPI_API_URL}
HAPI_BASE_URL=${HAPI_API_URL}
NEXT_PUBLIC_HAPI_WEB_URL=${HAPI_SERVER_URL}

# Claude API Configuration (add your key)
ANTHROPIC_API_KEY=your-claude-api-key-here

# Application Mode
NEXT_PUBLIC_USE_REAL_API=true
EOF

# Update Vercel configuration
echo "📝 Updating vercel.json..."

cat > vercel.json << EOF
{
  "functions": {
    "frontend/app/**": {
      "runtime": "@vercel/next@4.3.7"
    }
  },
  "builds": [
    {
      "src": "frontend/next.config.js",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "frontend/\$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_HAPI_BASE_URL": "${HAPI_API_URL}",
    "HAPI_BASE_URL": "${HAPI_API_URL}",
    "NEXT_PUBLIC_HAPI_WEB_URL": "${HAPI_SERVER_URL}",
    "NEXT_PUBLIC_USE_REAL_API": "true"
  }
}
EOF

echo "✅ Configuration updated successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Add your Claude API key to frontend/.env.local"
echo "2. Commit and push changes to trigger Vercel redeploy:"
echo "   git add ."
echo "   git commit -m 'Update to use custom HAPI server'"
echo "   git push origin feature/ai-summary-prototype"
echo ""
echo "3. Set Claude API key in Vercel dashboard:"
echo "   - Go to Vercel project settings"
echo "   - Add environment variable: ANTHROPIC_API_KEY"
echo ""
echo "4. Test the integration:"
echo "   - Visit your deployed Symphony app"
echo "   - Complete the 5-step workflow"
echo "   - Verify resources are created in your HAPI server"
echo ""
echo "🎉 Your custom HAPI server is ready for showcasing!"

# Optional: Test HAPI server connectivity
echo ""
echo "🔍 Testing HAPI server connectivity..."

if command -v curl &> /dev/null; then
    if curl -s -f "${HAPI_API_URL}/metadata" > /dev/null; then
        echo "✅ HAPI server is accessible and responding"
    else
        echo "⚠️  Warning: HAPI server may not be fully ready yet"
        echo "   Please wait a few minutes for deployment to complete"
    fi
else
    echo "ℹ️  curl not available - skipping connectivity test"
fi