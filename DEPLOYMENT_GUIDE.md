# Symphony Custom HAPI Server Deployment Guide

This guide walks you through deploying your own HAPI FHIR server for Symphony AI clinical summaries, allowing you to showcase the system with a dedicated FHIR environment.

## 🎯 Overview

After deployment, you'll have:
- **Custom HAPI FHIR Server**: Your own hosted FHIR server with Symphony branding
- **IPS Showcase Environment**: Optimized for displaying AI-generated clinical summaries
- **Web Interface**: Browse and explore FHIR resources like hapi.fhir.org
- **Full Integration**: Symphony automatically creates resources in your server

## 🚀 Quick Deployment (Railway - Recommended)

### Step 1: Deploy HAPI Server

1. **Sign up for Railway**: Go to [railway.app](https://railway.app) and create account

2. **Deploy from GitHub**:
   - Click "Deploy from GitHub"
   - Select your Symphony repository
   - Choose "Deploy from a folder" → `hapi-server`

3. **Configure Environment**:
   ```bash
   HAPI_FHIR_SERVER_ADDRESS=https://your-app.railway.app
   SERVER_PORT=8080
   ```

4. **Add Database** (Optional but recommended):
   - Add PostgreSQL service in Railway
   - Railway will automatically set `DATABASE_URL`

5. **Deploy**: Railway will build and deploy automatically

### Step 2: Update Symphony Configuration

1. **Run Update Script**:
   ```bash
   ./scripts/update-hapi-config.sh https://your-app.railway.app
   ```

2. **Add Claude API Key**:
   - Edit `frontend/.env.local`
   - Replace `your-claude-api-key-here` with your actual key

3. **Deploy Symphony**:
   ```bash
   git add .
   git commit -m "Update to use custom HAPI server"
   git push origin feature/ai-summary-prototype
   ```

4. **Configure Vercel Environment**:
   - Go to Vercel dashboard → your project → Settings → Environment Variables
   - Add: `ANTHROPIC_API_KEY` = your Claude API key

### Step 3: Test Integration

1. **Access Your HAPI Server**: https://your-app.railway.app
2. **Access Symphony**: Your Vercel app URL
3. **Complete Workflow**: Use Symphony to create IPS documents
4. **View Results**: Check your HAPI server for created resources

## 🔧 Alternative Deployment Options

### Option A: Render

1. **Create Render Account**: Go to [render.com](https://render.com)

2. **Create Web Service**:
   - Connect GitHub repository
   - Select `hapi-server` directory
   - Configure:
     ```
     Build Command: docker build -t symphony-hapi .
     Start Command: java -jar /app/main.jar
     Port: 8080
     ```

3. **Set Environment Variables**:
   ```bash
   HAPI_FHIR_SERVER_ADDRESS=https://your-app.render.com
   DATABASE_URL=postgresql://... (from Render PostgreSQL)
   ```

### Option B: Google Cloud Run

1. **Build and Push Image**:
   ```bash
   cd hapi-server
   docker build -t gcr.io/PROJECT-ID/symphony-hapi .
   docker push gcr.io/PROJECT-ID/symphony-hapi
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy symphony-hapi \
     --image gcr.io/PROJECT-ID/symphony-hapi \
     --platform managed \
     --port 8080 \
     --allow-unauthenticated
   ```

### Option C: Docker Compose (Self-hosted)

1. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   services:
     hapi:
       build: ./hapi-server
       ports:
         - "8080:8080"
       environment:
         - DATABASE_URL=postgresql://postgres:password@db:5432/symphony
         - HAPI_FHIR_SERVER_ADDRESS=http://localhost:8080
       depends_on:
         - db

     db:
       image: postgres:15
       environment:
         POSTGRES_DB: symphony
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

2. **Deploy**:
   ```bash
   docker-compose up -d
   ```

## 🎨 Customization Options

### Branding Customization

1. **Update Templates**: Edit `hapi-server/src/main/webapp/WEB-INF/templates/tmpl-banner.html`
2. **Modify Styling**: Update `hapi-server/src/main/webapp/css/custom.css`
3. **Add Logo**: Place logo in `hapi-server/src/main/webapp/img/`

### Configuration Customization

1. **Server Settings**: Modify `hapi-server/application.yaml`
2. **FHIR Features**: Enable/disable FHIR capabilities
3. **Security**: Add authentication if needed
4. **Sample Data**: Update `hapi-server/src/main/resources/sample-data.json`

## 📊 Monitoring and Maintenance

### Health Monitoring

- **Health Check**: `https://your-server.com/actuator/health`
- **Metrics**: `https://your-server.com/actuator/metrics`
- **FHIR Metadata**: `https://your-server.com/fhir/metadata`

### Database Management

- **PostgreSQL**: Use standard PostgreSQL tools
- **Backups**: Configure automated backups via cloud provider
- **Monitoring**: Track database performance and usage

### Logs and Debugging

- **Application Logs**: Available via platform dashboard
- **FHIR Logs**: Monitor API requests and responses
- **Error Tracking**: Set up error monitoring service

## 🔒 Security Considerations

### Production Security

1. **Authentication**: Enable FHIR security if needed
2. **HTTPS**: Ensure all communications use HTTPS
3. **Database**: Secure database with strong passwords
4. **CORS**: Configure appropriate CORS settings
5. **Rate Limiting**: Add rate limiting for API endpoints

### Demo/Showcase Security

- Current setup allows open access for demonstrations
- CORS configured for frontend integration
- No authentication required for easy showcasing

## 🎬 Showcase Setup

### Pre-populate with Demo Data

1. **Sample Patients**: Add realistic test patients
2. **IPS Documents**: Create example clinical summaries
3. **Various Use Cases**: Show different clinical scenarios

### Demo Workflow

1. **Show HAPI Server**: Start with browsing existing resources
2. **Use Symphony**: Demonstrate the 5-step workflow
3. **View Results**: Show created IPS documents in HAPI server
4. **Export Data**: Demonstrate JSON/CSV export functionality

## 🛠️ Troubleshooting

### Common Issues

1. **Deployment Fails**:
   - Check Docker build logs
   - Verify environment variables
   - Ensure port 8080 is exposed

2. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check database service status
   - Confirm network connectivity

3. **CORS Errors**:
   - Update CORS configuration in application.yaml
   - Verify frontend domain in allowed origins

4. **Symphony Integration Issues**:
   - Check environment variable configuration
   - Verify HAPI server URL accessibility
   - Test API endpoints directly

### Support Resources

- **HAPI FHIR Documentation**: https://hapifhir.io/
- **FHIR Specification**: https://hl7.org/fhir/
- **Railway Support**: https://railway.app/help
- **Symphony Issues**: GitHub repository issues

## 📈 Next Steps

After successful deployment:

1. **Customize Branding**: Update styling and templates
2. **Add Authentication**: Implement security if needed
3. **Monitor Usage**: Set up analytics and monitoring
4. **Scale Resources**: Adjust compute resources based on usage
5. **Backup Strategy**: Implement data backup procedures

## 🎉 Success Checklist

- [ ] HAPI server deployed and accessible
- [ ] Web interface shows Symphony branding
- [ ] Database connected and persistent
- [ ] Symphony updated to use custom server
- [ ] Claude API key configured
- [ ] End-to-end workflow tested
- [ ] IPS documents created and viewable
- [ ] Export functionality working
- [ ] Ready for demonstration!

Your custom HAPI FHIR server is now ready to showcase Symphony AI's clinical summary capabilities! 🚀