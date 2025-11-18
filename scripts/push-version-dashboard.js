#!/usr/bin/env node

const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fs = require('fs').promises;
const path = require('path');

// Constants
const PROXY = 'http://10.149.16.141:3546';
const BASE_URL = 'http://10.149.16.95:30085/v1/kv/versions/coreplatform';
const VALID_ENVIRONMENTS = ['aws-stg-eu00', 'aws-prod-eu00', 'aws-stg-na03', 'aws-prod-na03'];

// Parse command line arguments
const args = process.argv.slice(2);
const environmentArg = args.find((arg) => arg.startsWith('--environment='));

if (!environmentArg) {
    console.error('Error: --environment parameter is required');
    console.error('\nUsage: cat versions.txt | ./scripts/update-lambda-version.js --environment=<env>');
    console.error('Example: cat versions.txt | ./scripts/update-lambda-version.js --environment=aws-stg-eu00');
    console.error('\nValid environments:');
    console.error(VALID_ENVIRONMENTS.map((env) => `  - ${env}`).join('\n'));
    process.exit(1);
}

const environment = environmentArg.split('=')[1];

if (!VALID_ENVIRONMENTS.includes(environment)) {
    console.error(`Error: Invalid environment "${environment}"`);
    console.error('\nValid environments:');
    console.error(VALID_ENVIRONMENTS.map((env) => `  - ${env}`).join('\n'));
    process.exit(1);
}

// Function to validate version format
function isValidVersion(version) {
    return /^\d+\.\d+\.\d+$/.test(version);
}

// Function to read package.json and get relComponent
async function getRelComponent(folder) {
    try {
        const packageJsonPath = path.join(process.cwd(), 'functions', folder, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

        if (!packageJson.relComponent) {
            throw new Error(
                `Missing relComponent property. Add "relComponent": "your_component_name" to package.json. Note: relComponent is required for version dashboard tracking even if function has "skipRelTicket": true`,
            );
        }

        // Warn if both relComponent and skipRelTicket are present
        if (packageJson.skipRelTicket === true) {
            console.warn(`⚠️  Warning: ${folder} has both relComponent and skipRelTicket=true. Using relComponent.`);
        }

        return packageJson.relComponent;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`package.json not found in folder: ${folder}`);
        }
        throw error;
    }
}

// Function to update a single version
async function updateVersion(lambdaName, version, shouldUseProxy) {
    const url = `${BASE_URL}/${environment}/${lambdaName}`;
    console.log(`\n--- Processing: ${lambdaName} ---`);
    console.log(`URL: ${url}`);
    console.log(`Version: ${version}`);

    if (shouldUseProxy) {
        console.log(`Using proxy: ${PROXY}`);
        try {
            // First try with direct proxy configuration
            const response = await axios.put(url, version, {
                proxy: {
                    host: '10.149.16.141',
                    port: 3546,
                    protocol: 'http',
                },
                maxRedirects: 0,
                timeout: 5000,
            });

            console.log(`Success: ${response.data || '(No output)'}`);
            return true;
        } catch (error) {
            if (error.code === 'ECONNRESET') {
                console.log('Connection reset error detected, trying with HttpsProxyAgent...');
                try {
                    const agent = new HttpsProxyAgent(PROXY);
                    const response = await axios.put(url, version, {
                        httpsAgent: agent,
                        maxRedirects: 0,
                        timeout: 5000,
                    });
                    console.log(`Success with agent: ${response.data || '(No output)'}`);
                    return true;
                } catch (agentError) {
                    console.error(`Failed with agent: ${agentError.message}`);
                    if (agentError.response) {
                        console.error(
                            `Response error: ${agentError.response.status} - ${agentError.response.statusText}`,
                        );
                    }
                    return false;
                }
            }

            console.error(`Failed: ${error.message}`);
            if (error.response) {
                console.error(`Response error: ${error.response.status} - ${error.response.statusText}`);
            }
            return false;
        }
    } else {
        try {
            console.log('Attempting request without proxy...');
            const response = await axios.put(url, version, {
                maxRedirects: 0,
                timeout: 5000,
            });
            console.log(`Success without proxy: ${response.data || '(No output)'}`);
            return true;
        } catch (error) {
            console.error(`Attempt without proxy failed: ${error.message}`);
            if (error.response) {
                console.error(`Response error: ${error.response.status} - ${error.response.statusText}`);
            }
            return false;
        }
    }
}

// Function to validate input JSON
function validateInput(versions) {
    const errors = [];

    if (typeof versions !== 'object' || Array.isArray(versions)) {
        throw new Error('Input must be a JSON object');
    }

    for (const [key, data] of Object.entries(versions)) {
        if (!data.version) {
            errors.push(`${key}: missing version property`);
        } else if (!isValidVersion(data.version)) {
            errors.push(`${key}: invalid version format "${data.version}" (expected: x.y.z)`);
        }

        if (!data.folder) {
            errors.push(`${key}: missing folder property`);
        }
    }

    if (errors.length > 0) {
        throw new Error('Invalid input format:\n' + errors.map((err) => `  - ${err}`).join('\n'));
    }
}

// Read from stdin
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
    inputData += chunk;
});

process.stdin.on('end', async () => {
    try {
        // Parse and validate the JSON input
        const versions = JSON.parse(inputData);
        validateInput(versions);

        const results = [];
        const errors = [];

        // Process each entry
        for (const [key, data] of Object.entries(versions)) {
            try {
                const lambdaName = await getRelComponent(data.folder);
                const success = await updateVersion(lambdaName, data.version, false);
                results.push({ key, lambdaName, version: data.version, success });
            } catch (error) {
                console.error(`\nError processing ${key}:`, error.message);
                errors.push({ key, error: error.message });
                results.push({ key, success: false });
            }
        }

        // Summary
        console.log('\n=== Update Summary ===');
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        console.log(`\nTotal: ${results.length}`);
        console.log(`Successful: ${successful.length}`);
        console.log(`Failed: ${failed.length}`);

        if (successful.length > 0) {
            console.log('\nSuccessful updates:');
            for (const result of successful) {
                console.log(`  ✓ ${result.key} (${result.lambdaName} -> ${result.version})`);
            }
        }

        if (failed.length > 0) {
            console.log('\nFailed updates:');
            for (const result of failed) {
                const error = errors.find((e) => e.key === result.key);
                console.log(`  ✗ ${result.key}${error ? `: ${error.error}` : ''}`);
            }
        }

        // Exit with error if any updates failed
        process.exit(failed.length > 0 ? 1 : 0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
