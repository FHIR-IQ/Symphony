# Symphony HAPI FHIR Server

Custom HAPI FHIR server deployment for the Symphony AI clinical summary platform. This server provides a dedicated FHIR environment for showcasing AI-generated International Patient Summary (IPS) documents.

## Features

- **FHIR R4 Compliance**: Full FHIR R4 server implementation
- **IPS Support**: Specialized for International Patient Summary documents
- **Web Interface**: Browse and explore FHIR resources via web UI
- **Custom Branding**: Symphony-themed interface and styling
- **RESTful API**: Complete FHIR REST API with search capabilities
- **Persistent Storage**: PostgreSQL database for production data persistence
- **AI Integration**: Optimized for Symphony AI-generated clinical content

## Quick Deployment

### Option 1: Railway (Recommended)

1. **Connect Repository**:
   - Go to [Railway](https://railway.app/)
   - Create new project from GitHub repository
   - Select the `hapi-server` directory

2. **Configure Environment**:
   ```bash
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   HAPI_FHIR_SERVER_ADDRESS=https://your-app.railway.app
   SERVER_PORT=8080
   ```

3. **Deploy**:
   - Railway will automatically build and deploy
   - Access your server at: `https://your-app.railway.app`

### Option 2: Manual Docker Deployment

1. **Build Image**:
   ```bash
   cd hapi-server
   docker build -t symphony-hapi .
   ```

2. **Run Container**:
   ```bash
   docker run -p 8080:8080 \
     -e DATABASE_URL=your_db_url \
     -e HAPI_FHIR_SERVER_ADDRESS=http://localhost:8080 \
     symphony-hapi
   ```

### Option 3: Render Deployment

1. **Create Render Service**:
   - Go to [Render](https://render.com/)
   - Create new Web Service from GitHub
   - Select `hapi-server` directory

2. **Configure Build**:
   - Build Command: `docker build -t symphony-hapi .`
   - Start Command: `java -jar /app/main.jar`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | In-memory H2 |
| `DATABASE_USERNAME` | Database username | - |
| `DATABASE_PASSWORD` | Database password | - |
| `HAPI_FHIR_SERVER_ADDRESS` | Public server URL | - |
| `SERVER_PORT` | Server port | 8080 |

### Database Setup

For production deployment, configure PostgreSQL:

```yaml
# Railway PostgreSQL
DATABASE_URL: postgresql://postgres:password@host:5432/symphony_fhir

# Or individual components
DATABASE_URL: jdbc:postgresql://host:5432/symphony_fhir
DATABASE_USERNAME: postgres
DATABASE_PASSWORD: your_password
DATABASE_DRIVER: org.postgresql.Driver
HIBERNATE_DIALECT: org.hibernate.dialect.PostgreSQLDialect
```

## API Endpoints

### FHIR Base URL
- **Base**: `/fhir`
- **Metadata**: `/fhir/metadata`

### Key Resources
- **Patients**: `/fhir/Patient`
- **Compositions**: `/fhir/Composition`
- **DocumentReferences**: `/fhir/DocumentReference`
- **Observations**: `/fhir/Observation`

### Web Interface
- **Home**: `/`
- **Resource Browser**: `/fhir/[ResourceType]`
- **Search**: `/fhir/[ResourceType]?[parameters]`

## Symphony Integration

After deploying your HAPI server, update Symphony configuration:

1. **Update Environment Variables**:
   ```bash
   NEXT_PUBLIC_HAPI_BASE_URL=https://your-app.railway.app/fhir
   HAPI_BASE_URL=https://your-app.railway.app/fhir
   NEXT_PUBLIC_HAPI_WEB_URL=https://your-app.railway.app
   ```

2. **Redeploy Symphony**: Push changes to trigger Vercel redeploy

3. **Test Integration**: Use Symphony to create and view IPS documents

## Sample Data

The server can be pre-populated with sample data for demonstrations:

### Sample Patients
- Test patients with various clinical conditions
- Longitudinal data for realistic summaries
- IPS-compatible resource structures

### Sample IPS Documents
- Pre-created Composition resources
- Rich clinical narratives
- Multiple use case examples

## Monitoring and Maintenance

### Health Checks
- **Health Endpoint**: `/actuator/health`
- **Metrics**: `/actuator/metrics`
- **Info**: `/actuator/info`

### Database Management
- **H2 Console**: `/h2-console` (development only)
- **PostgreSQL**: Use standard PostgreSQL tools

### Logs
- Application logs available via platform logging
- FHIR operation logs for debugging
- Performance metrics tracking

## Security Considerations

### Production Security
- Enable authentication if required
- Configure CORS for specific domains
- Use HTTPS for all communications
- Secure database connections

### Demo/Showcase Setup
- Current configuration allows open access
- CORS enabled for frontend integration
- No authentication required for demonstrations

## Troubleshooting

### Common Issues

1. **Database Connection**:
   - Verify DATABASE_URL format
   - Check network connectivity
   - Confirm database exists

2. **CORS Errors**:
   - Update allowed origins in configuration
   - Verify frontend domain matches CORS settings

3. **Memory Issues**:
   - Increase container memory limits
   - Monitor resource usage
   - Optimize database queries

### Support

For issues and support:
- Check server logs via platform dashboard
- Verify environment variable configuration
- Test API endpoints directly
- Review FHIR compliance with `/fhir/metadata`

## Development

### Local Development

1. **Clone Repository**:
   ```bash
   git clone https://github.com/FHIR-IQ/Symphony.git
   cd Symphony/hapi-server
   ```

2. **Run Locally**:
   ```bash
   docker build -t symphony-hapi .
   docker run -p 8080:8080 symphony-hapi
   ```

3. **Access Server**: http://localhost:8080

### Customization

- **Branding**: Modify templates in `src/main/webapp/WEB-INF/templates/`
- **Styling**: Update CSS in `src/main/webapp/css/custom.css`
- **Configuration**: Edit `application.yaml`
- **Features**: Extend HAPI FHIR configuration as needed