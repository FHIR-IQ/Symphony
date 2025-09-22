#!/bin/bash

# Symphony HAPI FHIR Server Deployment Script
# This script helps deploy the HAPI server to various cloud platforms

set -e

echo "🚀 Symphony HAPI FHIR Server Deployment"
echo "======================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Function to deploy to Railway
deploy_railway() {
    echo "📡 Deploying to Railway..."

    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi

    echo "Please ensure you're logged in to Railway: railway login"
    read -p "Press Enter to continue..."

    railway link
    railway up

    echo "✅ Railway deployment initiated!"
    echo "🌐 Your HAPI server will be available at: https://your-app.railway.app"
}

# Function to build Docker image locally
build_local() {
    echo "🏗️ Building Docker image locally..."

    docker build -t symphony-hapi .

    echo "✅ Docker image built successfully!"
    echo "To run locally: docker run -p 8080:8080 symphony-hapi"
}

# Function to deploy to Render
deploy_render() {
    echo "🎨 Deploying to Render..."
    echo "Please follow these steps:"
    echo "1. Go to https://render.com/"
    echo "2. Create a new Web Service"
    echo "3. Connect your GitHub repository"
    echo "4. Select the 'hapi-server' directory"
    echo "5. Configure the following:"
    echo "   - Build Command: docker build -t symphony-hapi ."
    echo "   - Start Command: java -jar /app/main.jar"
    echo "   - Port: 8080"
    echo ""
    echo "Environment Variables to set:"
    echo "- HAPI_FHIR_SERVER_ADDRESS: https://your-app.render.com"
    echo "- DATABASE_URL: (Render PostgreSQL URL)"
}

# Function to show environment setup
show_env_setup() {
    echo "🔧 Environment Variable Setup"
    echo "=============================="
    echo ""
    echo "Required Environment Variables:"
    echo "- HAPI_FHIR_SERVER_ADDRESS: Your public server URL"
    echo "- DATABASE_URL: PostgreSQL connection string (optional)"
    echo "- SERVER_PORT: 8080 (default)"
    echo ""
    echo "For Railway deployment:"
    echo "railway variables set HAPI_FHIR_SERVER_ADDRESS=https://your-app.railway.app"
    echo ""
    echo "For production with PostgreSQL:"
    echo "railway variables set DATABASE_URL=postgresql://user:pass@host:port/dbname"
}

# Main menu
echo "Select deployment option:"
echo "1) Deploy to Railway (Recommended)"
echo "2) Build Docker image locally"
echo "3) Deploy to Render (Manual steps)"
echo "4) Show environment setup"
echo "5) Exit"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_railway
        ;;
    2)
        build_local
        ;;
    3)
        deploy_render
        ;;
    4)
        show_env_setup
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📝 Next Steps:"
echo "1. Wait for deployment to complete"
echo "2. Test your HAPI server at the provided URL"
echo "3. Update Symphony environment variables to use your server"
echo "4. Redeploy Symphony with the new configuration"
echo ""
echo "🎉 Happy showcasing with your custom HAPI FHIR server!"