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

// Create proxy middleware for all FHIR requests
const fhirProxy = createProxyMiddleware({
  target: 'https://hapi.fhir.org',
  changeOrigin: true,
  pathRewrite: {
    '^/fhir': '/baseR4'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} -> https://hapi.fhir.org/baseR4${req.url.replace('/fhir', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to proxied responses
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, Accept';
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