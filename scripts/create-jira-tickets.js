#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execFileSync } = require('child_process');

// Configuration
const DEPLOYMENT_REGIONS_CONFIG = path.join(__dirname, 'deployment-regions-config.json');
const TEST_EVIDENCE_MANIFEST = path.join(process.cwd(), 'test-evidence', 'manifest.json');

// Command line argument parsing
const args = process.argv.slice(2);
const environmentArg = args.find((arg) => arg.startsWith('--environment='));

if (!environmentArg) {
    console.error('Error: --environment parameter is required');
    console.error('Usage: ./create-jira-tickets.js --environment=uk_es|eu03|na');
    process.exit(1);
}

const environment = environmentArg.split('=')[1];

if (!['uk_es', 'eu03', 'na'].includes(environment)) {
    console.error('Error: Environment must be one of: uk_es, eu03, na');
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

        if (packageJson.skipRelTicket === true) {
            console.warn(`Warning: ${folder} has both relComponent and skipRelTicket=true. Using relComponent.`);
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

// Load the per-project test-evidence manifest produced by scripts/finalize-test-evidence-manifest.js.
// Returns {} when the manifest doesn't exist (pipeline hasn't produced evidence yet) so callers can skip threading.
async function loadTestEvidenceManifest() {
    try {
        const raw = await fs.readFile(TEST_EVIDENCE_MANIFEST, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        console.warn(`Could not load test-evidence manifest (${error.code || 'ERR'}): ${error.message}`);
        return {};
    }
}

// Resolve { testingJobUrl, testingEvidenceFilePath } for a single versions.json key.
// Verifies the referenced markdown file exists on disk; returns null when nothing usable is available.
async function getTestEvidenceForPackageKey(key, manifest) {
    const entry = manifest[key];
    if (!entry || !entry.path) return null;

    const absPath = path.isAbsolute(entry.path) ? entry.path : path.join(process.cwd(), entry.path);
    try {
        await fs.access(absPath);
    } catch (_err) {
        return null;
    }

    return {
        testingJobUrl: entry.jobUrl || null,
        testingEvidenceFilePath: absPath,
    };
}

// Parse NJA CLI output: find the "STATUS xxx" line (may not be first due to app logs),
// then extract the JSON body from the first [ or { after it.
function parseNjaOutput(output) {
    const lines = output.split('\n');
    const statusIdx = lines.findIndex((l) => /^STATUS \d{3}$/.test(l.trim()));
    if (statusIdx === -1) {
        throw new Error(`No STATUS line found in CLI output:\n${output}`);
    }
    const status = parseInt(lines[statusIdx].trim().replace('STATUS ', ''), 10);
    const afterStatus = lines.slice(statusIdx + 1).join('\n');
    // Find the first JSON structure in the remaining output
    const jsonStart = afterStatus.search(/[[{]/);
    const bodyText = jsonStart >= 0 ? afterStatus.slice(jsonStart).trim() : afterStatus.trim();
    return { status, bodyText };
}

// Function to create Jira ticket via NJA CLI
function createJiraTicket(deployableName, deployableVersion, regions, testingEvidence) {
    const cliArgs = [
        'ticket',
        'upsert',
        '--deployable-name',
        deployableName,
        '--deployable-version',
        deployableVersion,
        '--region',
        ...regions,
    ];

    // GitLab always sets CI_PIPELINE_URL in pipeline jobs; forward it to NJA so the
    // REL ticket carries a link back to the pipeline that produced the release.
    const pipelineUrl = process.env.CI_PIPELINE_URL;
    if (pipelineUrl && pipelineUrl.trim() !== '') {
        cliArgs.push('--pipeline-url', pipelineUrl);
    }

    if (testingEvidence && testingEvidence.testingJobUrl) {
        cliArgs.push('--testing-job-url', testingEvidence.testingJobUrl);
    }

    if (testingEvidence && testingEvidence.testingEvidenceFilePath) {
        cliArgs.push('--testing-evidence-file', testingEvidence.testingEvidenceFilePath);
    }

    console.log(`Creating ticket for ${deployableName} v${deployableVersion} in regions: ${regions.join(', ')}`);

    try {
        const output = execFileSync('nja', cliArgs, { encoding: 'utf-8' });
        const { bodyText } = parseNjaOutput(output);

        const responseData = JSON.parse(bodyText);
        const ticketData = Array.isArray(responseData) ? responseData[0] : responseData;
        const ticketId = ticketData.ticket || ticketData.ticketId || ticketData.id || ticketData.key;
        const ticketLink = ticketData.link || ticketData.url || ticketData.ticketLink || ticketData.issue;

        if (!ticketId || !ticketId.match(/^REL-\d+$/)) {
            throw new Error(`Invalid ticket ID format: ${ticketId}. Expected format: REL-XXXXX`);
        }

        console.log(`Ticket created successfully for ${deployableName}: ${ticketId}`);
        if (ticketLink) {
            console.log(`  Link: ${ticketLink}`);
        }

        return { success: true, ticketId, ticketLink, response: responseData };
    } catch (error) {
        const stdout = error.stdout || '';
        const stderr = error.stderr || '';
        const errorDetail = stdout || stderr || error.message;
        console.error(`Failed to create ticket for ${deployableName}: ${errorDetail}`);
        return { success: false, error: errorDetail };
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

    const versionsPath = path.join(process.cwd(), 'versions.json');
    const tempPath = `${versionsPath}.tmp-${process.pid}-${Date.now()}`;
    const payload = JSON.stringify(updatedVersions, null, 2);
    const permissionErrors = new Set(['EACCES', 'EPERM']);

    try {
        // Write to a temp file first and then atomically replace versions.json.
        // This avoids direct open/write failures when the existing artifact file is read-only.
        await fs.writeFile(tempPath, payload);

        try {
            await fs.rename(tempPath, versionsPath);
        } catch (error) {
            if (!permissionErrors.has(error.code)) {
                throw error;
            }

            // Some artifact providers restore versions.json as read-only and reject replacement.
            // Make the target writable and retry the atomic replacement.
            try {
                await fs.chmod(versionsPath, 0o644);
            } catch (chmodError) {
                if (!(chmodError.code === 'ENOENT')) {
                    throw chmodError;
                }
            }

            await fs.rename(tempPath, versionsPath);
        }

        console.log('\nSuccessfully updated versions.json with ticket IDs');
        return true;
    } catch (error) {
        try {
            await fs.unlink(tempPath);
        } catch (_cleanupError) {
            // Ignore cleanup errors.
        }
        console.error(`Failed to update versions.json: ${error.message}`);
        throw error;
    }
}

// Main execution
async function main() {
    let inputData = '';

    // Read from stdin
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

        // Load test-evidence manifest once; missing/empty is fine (returns {}).
        const evidenceManifest = await loadTestEvidenceManifest();
        const evidenceKeys = Object.keys(evidenceManifest);
        console.log(
            `Loaded test-evidence manifest with ${evidenceKeys.length} entr${evidenceKeys.length === 1 ? 'y' : 'ies'}.`,
        );

        const results = [];
        const errors = [];
        const ticketMappings = {};

        // Process each entry
        for (const [key, data] of Object.entries(versions)) {
            try {
                // Skip if ticket already exists (for pipeline reruns)
                if (data.relTicket) {
                    console.log(`Skipping ${key} - already has ticket: ${data.relTicket}`);
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
                    console.log(`Skipping ${key} - marked as skipRelTicket=true (no JIRA ticket needed)`);
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
                const testingEvidence = await getTestEvidenceForPackageKey(key, evidenceManifest);
                if (!testingEvidence) {
                    console.warn(
                        `No test evidence found for ${key}; REL ticket will use NJA's default Testing Performed text.`,
                    );
                }
                const result = createJiraTicket(relComponent, data.version, regions, testingEvidence);

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
                    console.log(`  ${result.key} (skipped - no REL ticket needed)`);
                } else {
                    console.log(`  ${result.key} (${result.relComponent} v${result.version}) -> ${result.ticketId}`);
                }
            }
        }

        if (failed.length > 0) {
            console.log('\nFailed ticket creations:');
            for (const result of failed) {
                const error = errors.find((e) => e.key === result.key);
                console.log(`  ${result.key}${error ? `: ${error.error}` : ''}`);
            }
        }

        // Update versions.json with successful ticket IDs (even if some failed)
        if (successful.length > 0) {
            try {
                await updateVersionsWithTickets(versions, ticketMappings);
                console.log(`\nUpdated versions.json with ${successful.length} ticket ID(s)`);
            } catch (error) {
                console.error('\nFailed to update versions.json with ticket IDs');
                process.exit(1);
            }
        }

        // Always exit with error if any tickets failed to create
        if (failed.length > 0) {
            console.log(`\nPipeline will fail due to ${failed.length} failed ticket creation(s)`);
            console.log('Rerun the pipeline to retry failed tickets - successful tickets will be skipped');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
