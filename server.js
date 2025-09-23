const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Symphony FHIR Proxy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// FHIR metadata endpoint with direct fetch
app.get('/fhir/metadata', async (req, res) => {
  try {
    console.log('Fetching FHIR metadata...');
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://hapi.fhir.org/baseR4/metadata', {
      headers: {
        'Accept': 'application/fhir+json',
        'User-Agent': 'Symphony-FHIR-Proxy/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HAPI server responded with ${response.status}`);
    }

    const data = await response.text();
    res.set('Content-Type', 'application/fhir+json');
    res.send(data);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({
      error: 'Failed to fetch FHIR metadata',
      message: error.message
    });
  }
});

// Preload sample data endpoint
app.post('/fhir/preload-samples', async (req, res) => {
  try {
    console.log('Starting to preload Synthea sample data...');
    const fetch = (await import('node-fetch')).default;

    // List of sample patient IDs from Synthea sample data
    const samplePatients = [
      'c69f87e5-4c5e-4c8b-b8e9-2b7f6d6c8e9d',
      'a85d6c7e-4e8f-4d9a-b2c3-8f7e6d5c4b3a',
      '9f8e7d6c-5b4a-3928-8172-6e5d4c3b2a19'
    ];

    // Create sample patients if they don't exist
    for (const patientId of samplePatients) {
      try {
        const patientResponse = await fetch(`https://hapi.fhir.org/baseR4/Patient/${patientId}`, {
          headers: { 'Accept': 'application/fhir+json' }
        });

        if (patientResponse.status === 404) {
          // Create a sample patient
          const samplePatient = {
            resourceType: 'Patient',
            id: patientId,
            name: [{
              family: 'Sample',
              given: [`Patient${patientId.slice(0, 8)}`]
            }],
            gender: 'unknown',
            birthDate: '1980-01-01'
          };

          await fetch('https://hapi.fhir.org/baseR4/Patient', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/fhir+json',
              'Accept': 'application/fhir+json'
            },
            body: JSON.stringify(samplePatient)
          });

          console.log(`Created sample patient: ${patientId}`);
        }
      } catch (err) {
        console.log(`Failed to create patient ${patientId}:`, err.message);
      }
    }

    res.json({
      message: 'Sample data preload attempted',
      samplePatients: samplePatients,
      note: 'Check logs for details on created resources'
    });
  } catch (error) {
    console.error('Error preloading sample data:', error);
    res.status(500).json({
      error: 'Failed to preload sample data',
      message: error.message
    });
  }
});

// Create proxy middleware for all FHIR requests
const fhirProxy = createProxyMiddleware({
  target: 'https://hapi.fhir.org',
  changeOrigin: true,
  pathRewrite: {
    '^/fhir': '/baseR4'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} -> https://hapi.fhir.org/baseR4${req.url.replace('/fhir', '')}`);

    // For write operations, add proper headers
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      proxyReq.setHeader('Content-Type', 'application/fhir+json');
      proxyReq.setHeader('Accept', 'application/fhir+json');
      console.log(`Write operation: ${req.method} with Content-Type: application/fhir+json`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to proxied responses
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, Accept, X-Requested-With';

    console.log(`Response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Use proxy for all /fhir routes except metadata (which we handle above)
app.use('/fhir', (req, res, next) => {
  if (req.path === '/metadata') {
    next(); // Skip proxy for metadata, use our custom handler
  } else {
    fhirProxy(req, res, next);
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Symphony FHIR Proxy',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      fhir: '/fhir/*'
    },
    target: 'https://hapi.fhir.org/baseR4'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Symphony FHIR Proxy running on port ${PORT}`);
  console.log(`📡 Proxying FHIR requests to: https://hapi.fhir.org/baseR4`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});