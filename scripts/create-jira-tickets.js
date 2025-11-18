#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Configuration
const JIRA_ENDPOINT = 'http://nja.psnative.pgt.gaia/ticket';
const DEPLOYMENT_REGIONS_CONFIG = path.join(__dirname, 'deployment-regions-config.json');

// Command line argument parsing
const args = process.argv.slice(2);
const environmentArg = args.find((arg) => arg.startsWith('--environment='));

if (!environmentArg) {
    console.error('Error: --environment parameter is required');
    console.error('Usage: ./create-jira-tickets.js --environment=eu|na');
    process.exit(1);
}

const environment = environmentArg.split('=')[1];

if (!['eu', 'na'].includes(environment)) {
    console.error('Error: Environment must be either "eu" or "na"');
    process.exit(1);
}

console.log(`Creating Jira tickets for environment: ${environment}`);

// Function to check if function should skip REL ticket processing
async function shouldSkipRelTicket(folder) {
    try {
        const packageJsonPath = path.join(process.cwd(), 'functions', folder, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        return packageJson.skipRelTicket === true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`package.json not found in folder: ${folder}`);
        }
        throw error;
    }
}

// Function to read package.json and get relComponent
async function getRelComponent(folder) {
    try {
        const packageJsonPath = path.join(process.cwd(), 'functions', folder, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

        if (!packageJson.relComponent) {
            if (packageJson.skipRelTicket === true) {
                throw new Error('Function is marked to skip REL tickets but getRelComponent was called');
            }
            throw new Error(
                `Missing relComponent property. Either add "relComponent": "your_component_name" or "skipRelTicket": true to package.json`,
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

// Function to get regions for environment
async function getRegionsForEnvironment(env) {
    try {
        const regionsConfig = JSON.parse(await fs.readFile(DEPLOYMENT_REGIONS_CONFIG, 'utf8'));

        if (!regionsConfig[env]) {
            throw new Error(`Environment "${env}" not found in deployment regions config`);
        }

        return regionsConfig[env];
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Deployment regions config file not found: ${DEPLOYMENT_REGIONS_CONFIG}`);
        }
        throw error;
    }
}

// Function to create Jira ticket
async function createJiraTicket(deployableName, deployableVersion, regions) {
    const payload = {
        deployable_name: deployableName,
        deployable_version: deployableVersion,
        regions: regions,
    };

    console.log(`Creating ticket for ${deployableName} v${deployableVersion} in regions: ${regions.join(', ')}`);

    // DEBUG: Show the payload being sent
    console.log('🐛 DEBUG: API Request Details:');
    console.log(`  Endpoint: ${JIRA_ENDPOINT}`);
    console.log(`  Method: PATCH`);
    console.log(`  Headers: Content-Type: application/json, apikey: secret`);
    console.log(`  Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
        const response = await axios.patch(JIRA_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                apikey: 'secret',
            },
        });

        const responseData = response.data;

        // DEBUG: Show the response details
        console.log('🐛 DEBUG: API Response Details:');
        console.log(`  Status: ${response.status} ${response.statusText}`);
        console.log(`  Headers: ${JSON.stringify(response.headers, null, 2)}`);
        console.log(`  Response Data Type: ${typeof responseData}`);
        console.log(
            `  Response Data: ${typeof responseData === 'object' ? JSON.stringify(responseData, null, 2) : responseData}`,
        );

        let ticketId, ticketLink;

        // Handle both string and object responses
        if (typeof responseData === 'string') {
            console.log('🐛 DEBUG: Processing string response...');
            // Parse the response to extract ticket ID (expecting exactly 2 lines)
            const lines = responseData.split('\n').filter((line) => line.trim());
            if (lines.length !== 2) {
                throw new Error(
                    `Invalid API response: expected 2 lines, got ${lines.length}. Response: ${responseData}`,
                );
            }

            ticketId = lines[0].trim();
            ticketLink = lines[1].trim();
        } else if (typeof responseData === 'object' && responseData !== null) {
            console.log('🐛 DEBUG: Processing object response...');

            let ticketData = responseData;

            // Handle array response (API returns array with single object)
            if (Array.isArray(responseData)) {
                console.log('🐛 DEBUG: Response is an array, extracting first element...');
                if (responseData.length === 0) {
                    throw new Error('Response array is empty');
                }
                ticketData = responseData[0];
                console.log('🐛 DEBUG: Extracted ticket data:', JSON.stringify(ticketData, null, 2));
            }

            // Handle object response - look for common field names
            ticketId = ticketData.ticket || ticketData.ticketId || ticketData.id || ticketData.key;
            ticketLink = ticketData.link || ticketData.url || ticketData.ticketLink || ticketData.issue;

            if (!ticketId) {
                const availableFields = Array.isArray(responseData)
                    ? `Array with ${responseData.length} items. First item fields: ${Object.keys(ticketData).join(', ')}`
                    : Object.keys(responseData).join(', ');
                throw new Error(`No ticket ID found in response. Available fields: ${availableFields}`);
            }
        } else {
            throw new Error(`Unexpected response type: ${typeof responseData}. Response: ${responseData}`);
        }

        // Validate ticket ID format (REL-XXXXX)
        if (!ticketId.match(/^REL-\d+$/)) {
            throw new Error(`Invalid ticket ID format: ${ticketId}. Expected format: REL-XXXXX`);
        }

        console.log(`✓ Ticket created successfully for ${deployableName}: ${ticketId}`);
        if (ticketLink) {
            console.log(`  Link: ${ticketLink}`);
        }

        return {
            success: true,
            ticketId: ticketId,
            ticketLink: ticketLink,
            response: responseData,
        };
    } catch (error) {
        // Enhanced error logging
        console.log('🐛 DEBUG: Error Details:');
        console.log(`  Error Type: ${error.constructor.name}`);
        console.log(`  Error Message: ${error.message}`);

        if (error.response) {
            console.log(`  HTTP Status: ${error.response.status}`);
            console.log(`  Response Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
            console.log(`  Response Data Type: ${typeof error.response.data}`);
            console.log(
                `  Response Data: ${typeof error.response.data === 'object' ? JSON.stringify(error.response.data, null, 2) : error.response.data}`,
            );
        } else if (error.request) {
            console.log('  No response received from server');
            console.log(`  Request: ${JSON.stringify(error.request, null, 2)}`);
        }

        const errorMessage = error.response?.data || error.message;
        const statusCode = error.response?.status || 'Unknown';
        console.error(`✗ Failed to create ticket for ${deployableName}: HTTP ${statusCode}: ${errorMessage}`);
        return { success: false, error: `HTTP ${statusCode}: ${errorMessage}` };
    }
}

// Function to validate input JSON
function validateInput(versions) {
    if (typeof versions !== 'object' || versions === null) {
        throw new Error('Input must be a valid JSON object');
    }

    for (const [key, data] of Object.entries(versions)) {
        if (!data.version) {
            throw new Error(`Missing version for ${key}`);
        }
        if (!data.folder) {
            throw new Error(`Missing folder for ${key}`);
        }
    }
}

// Function to update versions.json with ticket IDs
async function updateVersionsWithTickets(originalVersions, ticketMappings) {
    const updatedVersions = { ...originalVersions };

    for (const [packageKey, ticketId] of Object.entries(ticketMappings)) {
        if (updatedVersions[packageKey]) {
            updatedVersions[packageKey].relTicket = ticketId;
        }
    }

    try {
        await fs.writeFile('versions.json', JSON.stringify(updatedVersions, null, 2));
        console.log('\n✓ Successfully updated versions.json with ticket IDs');
        return true;
    } catch (error) {
        console.error(`✗ Failed to update versions.json: ${error.message}`);
        throw error;
    }
}

// Main execution
async function main() {
    let inputData = '';

    // Read from stdin - simple and clean
    for await (const chunk of process.stdin) {
        inputData += chunk;
    }
    try {
        // Parse and validate the JSON input
        const versions = JSON.parse(inputData);
        validateInput(versions);

        // Get regions for this environment
        const regions = await getRegionsForEnvironment(environment);
        console.log(`Target regions for ${environment}: ${regions.join(', ')}`);

        const results = [];
        const errors = [];
        const ticketMappings = {};

        // Process each entry
        for (const [key, data] of Object.entries(versions)) {
            try {
                // Skip if ticket already exists (for pipeline reruns)
                if (data.relTicket) {
                    console.log(`⏭️  Skipping ${key} - already has ticket: ${data.relTicket}`);
                    results.push({
                        key,
                        relComponent: 'already-exists',
                        version: data.version,
                        success: true,
                        ticketId: data.relTicket,
                    });
                    continue;
                }

                // Check if this function should skip REL ticket processing
                const shouldSkip = await shouldSkipRelTicket(data.folder);
                if (shouldSkip) {
                    console.log(`⏭️  Skipping ${key} - marked as skipRelTicket=true (no JIRA ticket needed)`);
                    results.push({
                        key,
                        relComponent: 'skipped-no-rel-ticket',
                        version: data.version,
                        success: true,
                        ticketId: 'SKIPPED',
                        skipped: true,
                    });
                    continue;
                }

                const relComponent = await getRelComponent(data.folder);
                const result = await createJiraTicket(relComponent, data.version, regions);

                results.push({
                    key,
                    relComponent,
                    version: data.version,
                    success: result.success,
                    ticketId: result.success ? result.ticketId : null,
                });

                if (result.success) {
                    ticketMappings[key] = result.ticketId;
                } else {
                    errors.push({ key, error: result.error });
                }
            } catch (error) {
                console.error(`\nError processing ${key}:`, error.message);
                errors.push({ key, error: error.message });
                results.push({ key, success: false });
            }
        }

        // Summary
        console.log('\n=== Jira Ticket Creation Summary ===');
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        console.log(`\nTotal: ${results.length}`);
        console.log(`Successful: ${successful.length}`);
        console.log(`Failed: ${failed.length}`);

        if (successful.length > 0) {
            console.log('\nSuccessful ticket creations:');
            for (const result of successful) {
                if (result.skipped) {
                    console.log(`  ⏭️  ${result.key} (skipped - no REL ticket needed)`);
                } else {
                    console.log(`  ✓ ${result.key} (${result.relComponent} v${result.version}) → ${result.ticketId}`);
                }
            }
        }

        if (failed.length > 0) {
            console.log('\nFailed ticket creations:');
            for (const result of failed) {
                const error = errors.find((e) => e.key === result.key);
                console.log(`  ✗ ${result.key}${error ? `: ${error.error}` : ''}`);
            }
        }

        // Update versions.json with successful ticket IDs (even if some failed)
        if (successful.length > 0) {
            try {
                await updateVersionsWithTickets(versions, ticketMappings);
                console.log(`\n✓ Updated versions.json with ${successful.length} ticket ID(s)`);
            } catch (error) {
                console.error('\nFailed to update versions.json with ticket IDs');
                process.exit(1);
            }
        }

        // Always exit with error if any tickets failed to create
        if (failed.length > 0) {
            console.log(`\n💥 Pipeline will fail due to ${failed.length} failed ticket creation(s)`);
            console.log('💡 Rerun the pipeline to retry failed tickets - successful tickets will be skipped');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
