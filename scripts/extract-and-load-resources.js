#!/usr/bin/env node

/**
 * Script to extract individual resources from Synthea bundles and load them into HAPI FHIR server
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const HAPI_SERVER_URL = process.env.HAPI_SERVER_URL || 'https://hapi.fhir.org/baseR4';
const MAX_BUNDLES = parseInt(process.env.MAX_BUNDLES) || 10;
const MAX_RESOURCES_PER_TYPE = parseInt(process.env.MAX_RESOURCES_PER_TYPE) || 20;
const FHIR_DATA_DIR = path.join(__dirname, '..', 'fhir');

// Resource types we want to extract and load
const WANTED_RESOURCE_TYPES = [
  'Patient',
  'Encounter',
  'Observation',
  'Condition',
  'Procedure',
  'MedicationRequest',
  'AllergyIntolerance',
  'Immunization'
];

console.log(`🔄 Extracting and loading FHIR resources into: ${HAPI_SERVER_URL}`);
console.log(`📦 Max bundles: ${MAX_BUNDLES}, Max per resource type: ${MAX_RESOURCES_PER_TYPE}`);

async function postResource(resource, resourceType, resourceId) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${HAPI_SERVER_URL}/${resourceType}`);

    // Clean up the resource - remove fullUrl and ensure proper ID
    const cleanResource = { ...resource };
    delete cleanResource.fullUrl;

    const postData = JSON.stringify(cleanResource);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${resourceType}/${resourceId}: ${res.statusCode}`);
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          console.log(`❌ ${resourceType}/${resourceId}: ${res.statusCode}`);
          resolve({ success: false, statusCode: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`💥 ${resourceType}/${resourceId}: ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`⏰ ${resourceType}/${resourceId}: Timeout`);
      resolve({ success: false, error: 'Timeout' });
    });

    req.write(postData);
    req.end();
  });
}

async function extractAndLoadResources() {
  try {
    // Check if FHIR data directory exists
    if (!fs.existsSync(FHIR_DATA_DIR)) {
      console.error(`❌ FHIR data directory not found: ${FHIR_DATA_DIR}`);
      process.exit(1);
    }

    // Get bundle files
    const bundleFiles = fs.readdirSync(FHIR_DATA_DIR)
      .filter(file => file.endsWith('.json'))
      .slice(0, MAX_BUNDLES);

    console.log(`📁 Processing ${bundleFiles.length} bundle files`);

    // Collect resources by type
    const resourcesByType = {};
    WANTED_RESOURCE_TYPES.forEach(type => {
      resourcesByType[type] = [];
    });

    // Extract resources from bundles
    for (const filename of bundleFiles) {
      try {
        const filePath = path.join(FHIR_DATA_DIR, filename);
        const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (bundle.entry) {
          for (const entry of bundle.entry) {
            const resource = entry.resource;
            if (resource && WANTED_RESOURCE_TYPES.includes(resource.resourceType)) {
              if (resourcesByType[resource.resourceType].length < MAX_RESOURCES_PER_TYPE) {
                resourcesByType[resource.resourceType].push(resource);
              }
            }
          }
        }
      } catch (error) {
        console.log(`⚠️  Error processing ${filename}: ${error.message}`);
      }
    }

    // Display collection summary
    console.log('\n📊 Extracted resources:');
    Object.entries(resourcesByType).forEach(([type, resources]) => {
      console.log(`  ${type}: ${resources.length} resources`);
    });

    // Load resources to HAPI server
    let totalSuccess = 0;
    let totalErrors = 0;

    for (const [resourceType, resources] of Object.entries(resourcesByType)) {
      if (resources.length === 0) continue;

      console.log(`\n🔄 Loading ${resources.length} ${resourceType} resources...`);

      for (const resource of resources) {
        const result = await postResource(resource, resourceType, resource.id || 'unknown');

        if (result.success) {
          totalSuccess++;
        } else {
          totalErrors++;
        }

        // Small delay between resources
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`\n🎉 Loading complete!`);
    console.log(`✅ Successfully loaded: ${totalSuccess} resources`);
    console.log(`❌ Failed to load: ${totalErrors} resources`);

    if (totalSuccess > 0) {
      console.log(`\n🌟 HAPI FHIR server now contains synthetic patient data!`);
      console.log(`🔗 Access the server at: ${HAPI_SERVER_URL}`);
      console.log(`🔍 Try searching for patients: ${HAPI_SERVER_URL}/Patient`);
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Test server connectivity first
async function testServer() {
  console.log('🔍 Testing HAPI server connectivity...');

  return new Promise((resolve, reject) => {
    const url = new URL(`${HAPI_SERVER_URL}/metadata`);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json'
      }
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ HAPI server is accessible');
          resolve(true);
        } else {
          console.log(`❌ Server responded with: ${res.statusCode}`);
          reject(new Error(`Server not accessible: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Cannot connect to server: ${err.message}`);
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Server connection timeout'));
    });

    req.end();
  });
}

// Main execution
async function main() {
  try {
    await testServer();
    await extractAndLoadResources();
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractAndLoadResources, testServer };