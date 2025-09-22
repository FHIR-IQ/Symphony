# Deploy HAPI Server to Railway

## Quick Deploy Steps

1. **Sign up/Login to Railway**
   - Go to [https://railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select the Symphony repository
   - Choose the `hapi-server` directory

3. **Configure Environment Variables (Optional)**

   For production database (PostgreSQL):
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   DATABASE_USERNAME=user
   DATABASE_PASSWORD=password
   DATABASE_DRIVER=org.postgresql.Driver
   HIBERNATE_DIALECT=org.hibernate.dialect.PostgreSQLDialect
   ```

   For in-memory database (default):
   - No configuration needed, will use H2 in-memory database

4. **Deploy**
   - Railway will automatically:
     - Detect the Dockerfile
     - Build the Docker image
     - Deploy the container
     - Provide a public URL

5. **Access Your Server**
   - Your server will be available at: `https://[your-app].railway.app`
   - FHIR API endpoint: `https://[your-app].railway.app/fhir`
   - Web UI: `https://[your-app].railway.app`

## Verify Deployment

Test your deployment with these commands:

```bash
# Check server metadata
curl https://[your-app].railway.app/fhir/metadata

# Create a test patient
curl -X POST https://[your-app].railway.app/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "name": [{
      "family": "Test",
      "given": ["Symphony"]
    }]
  }'
```

## Update Frontend Configuration

After deployment, update your frontend environment:

1. Create/update `.env.production.local`:
   ```
   NEXT_PUBLIC_HAPI_SERVER_URL=https://[your-app].railway.app
   NEXT_PUBLIC_HAPI_BASE_PATH=/fhir
   ```

2. Redeploy frontend on Vercel

## Troubleshooting

If deployment fails:

1. Check Railway logs for errors
2. Verify Dockerfile is in the `hapi-server` directory
3. Ensure port 8080 is exposed in Dockerfile
4. Check that `application.yaml` is present

## Alternative: Deploy with Railway Button

Add this button to your README for one-click deploy:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/hapi-fhir)

Note: You'll need to create a Railway template first.