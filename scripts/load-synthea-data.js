#!/usr/bin/env node

/**
 * Script to load Synthea sample data into HAPI FHIR server
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const HAPI_SERVER_URL = process.env.HAPI_SERVER_URL || 'https://symphony-hapi.railway.app/fhir';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10;
const MAX_BUNDLES = parseInt(process.env.MAX_BUNDLES) || 50; // Limit for testing
const FHIR_DATA_DIR = path.join(__dirname, '..', 'fhir');

console.log(`🔄 Loading Synthea FHIR data into: ${HAPI_SERVER_URL}`);
console.log(`📦 Batch size: ${BATCH_SIZE}, Max bundles: ${MAX_BUNDLES}`);

async function postBundle(bundleData, filename) {
  return new Promise((resolve, reject) => {
    const url = new URL(HAPI_SERVER_URL);
    const postData = JSON.stringify(bundleData);

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
          console.log(`✅ ${filename}: ${res.statusCode}`);
          resolve({ success: true, statusCode: res.statusCode, data });
        } else {
          console.log(`❌ ${filename}: ${res.statusCode} - ${data}`);
          resolve({ success: false, statusCode: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`💥 ${filename}: ${err.message}`);
      resolve({ success: false, error: err.message });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      console.log(`⏰ ${filename}: Timeout`);
      resolve({ success: false, error: 'Timeout' });
    });

    req.write(postData);
    req.end();
  });
}

async function processBatch(files) {
  const promises = files.map(async (filename) => {
    try {
      const filePath = path.join(FHIR_DATA_DIR, filename);
      const bundleData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return await postBundle(bundleData, filename);
    } catch (error) {
      console.log(`💥 ${filename}: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  return await Promise.all(promises);
}

async function loadSyntheaData() {
  try {
    // Check if FHIR data directory exists
    if (!fs.existsSync(FHIR_DATA_DIR)) {
      console.error(`❌ FHIR data directory not found: ${FHIR_DATA_DIR}`);
      console.error('Please ensure Synthea data is extracted to the fhir/ directory');
      process.exit(1);
    }

    // Get all JSON files
    const allFiles = fs.readdirSync(FHIR_DATA_DIR)
      .filter(file => file.endsWith('.json'))
      .slice(0, MAX_BUNDLES); // Limit for testing

    console.log(`📁 Found ${allFiles.length} FHIR bundle files to process`);

    if (allFiles.length === 0) {
      console.error('❌ No FHIR bundle files found');
      process.exit(1);
    }

    // Process in batches
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      console.log(`\n🔄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allFiles.length/BATCH_SIZE)} (${batch.length} files)`);

      const results = await processBatch(batch);

      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });

      // Short delay between batches to avoid overwhelming the server
      if (i + BATCH_SIZE < allFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n🎉 Loading complete!`);
    console.log(`✅ Successfully loaded: ${successCount} bundles`);
    console.log(`❌ Failed to load: ${errorCount} bundles`);

    if (successCount > 0) {
      console.log(`\n🌟 HAPI FHIR server now contains synthetic patient data!`);
      console.log(`🔗 Access the server at: ${HAPI_SERVER_URL}`);
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
    await loadSyntheaData();
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { loadSyntheaData, testServer };