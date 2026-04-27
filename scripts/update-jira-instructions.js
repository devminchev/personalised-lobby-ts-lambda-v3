#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Environment mapping - maps CI environment names to target deployment environments
const ENVIRONMENT_CONFIG = {
    stg_eu00: { targetDeployEnv: 'prod_eu00' },
    stg_eu03: { targetDeployEnv: 'prod_eu03' },
    stg_na03: { targetDeployEnv: 'prod_na03' },
};

// GitLab pipeline URL (standard for all lambdas)
const GITLAB_PIPELINE_URL =
    'https://gitlab.ballys.tech/excite/native/applications/personalised-lobby-ts-lambda-v3/-/pipelines/new';

// URL length validation constant
const MAX_URL_LENGTH = 8000;

// Command line argument parsing
const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith('--environment='));

if (!envArg) {
    console.error('Error: --environment parameter is required');
    console.error('Usage: ./update-jira-instructions.js --environment=stg_eu00|stg_eu03|stg_na03');
    process.exit(1);
}

const environment = envArg.split('=')[1];
const envConfig = ENVIRONMENT_CONFIG[environment];

if (!envConfig) {
    console.error(`Error: Environment must be one of: ${Object.keys(ENVIRONMENT_CONFIG).join(', ')}`);
    process.exit(1);
}

console.log(`Updating Jira instructions for environment: ${environment}`);

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

// Function to read relComponent from package.json
async function getRelComponent(folder) {
    const packageJsonPath = path.join(process.cwd(), 'functions', folder, 'package.json');
    try {
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
        throw new Error(`Failed to read relComponent from ${packageJsonPath}: ${error.message}`);
    }
}

// Function to map CI environment to AWS deployment environment format
function getAwsDeploymentEnv(environment) {
    const mapping = {
        stg_eu00: 'aws-prod-eu00',
        stg_eu03: 'aws-prod-eu03',
        stg_na03: 'aws-prod-na03',
    };
    return mapping[environment];
}

// Function to validate URL length
function validateUrlLength(url, max = MAX_URL_LENGTH) {
    if (url.length > max) {
        throw new Error(`Generated GitLab URL exceeds ${max} characters`);
    }
}

// Function to build GitLab pipeline URL with pre-filled variables
function buildGitlabPipelineUrl({ versionsJson, targetDeployEnv }) {
    const base = `${GITLAB_PIPELINE_URL}?ref=main`;
    const url = `${base}&var%5BTARGET_VERSIONS_JSON%5D=${encodeURIComponent(
        versionsJson,
    )}&var%5BTARGET_DEPLOY_ENVIRONMENTS%5D=${encodeURIComponent(targetDeployEnv)}`;

    validateUrlLength(url);
    return url;
}

// Function to generate deployment instructions
function generateDeploymentInstructions(packageKey, version, folder, targetDeployEnv, relTicket) {
    const versionsJson = JSON.stringify({
        [packageKey]: {
            version: version,
            folder: folder,
            relTicket: relTicket,
        },
    });

    const link = buildGitlabPipelineUrl({ versionsJson, targetDeployEnv });
    return `Run deployment pipeline for ${packageKey} v${version}:\n${link}`;
}

// Function to generate rollback instructions
function generateRollbackInstructions(packageKey, rollbackVersion, folder, targetDeployEnv, relTicket) {
    const versionsJson = JSON.stringify({
        [packageKey]: {
            version: rollbackVersion,
            folder: folder,
            relTicket: relTicket,
        },
    });

    const link = buildGitlabPipelineUrl({ versionsJson, targetDeployEnv });
    return `Run rollback pipeline for ${packageKey}:\n${link}`;
}

// Function to update instructions for a Jira ticket via NJA CLI
function updateJiraInstructions(ticketId, deploymentInstructions, rollbackInstructions, relComponent, deploymentEnv) {
    const cliArgs = [
        'ticket',
        'instructions',
        ticketId,
        '--deployment-instructions',
        deploymentInstructions,
        '--rollback-instructions',
        rollbackInstructions,
        '--rel-component',
        relComponent,
        '--deployment-env',
        deploymentEnv,
    ];

    console.log(`Updating instructions for ticket ${ticketId}`);

    try {
        execFileSync('nja', cliArgs, { encoding: 'utf-8' });
        console.log(`Successfully updated instructions for ${ticketId}`);
        return { success: true, ticketId };
    } catch (error) {
        const stdout = error.stdout || '';
        const stderr = error.stderr || '';
        const errorDetail = stdout || stderr || error.message;
        console.error(`Failed to update instructions for ticket ${ticketId}: ${errorDetail}`);
        return { success: false, ticketId, error: errorDetail };
    }
}

// Function to extract ticket data from versions.json
function extractTicketData(versions) {
    const ticketData = [];

    for (const [key, data] of Object.entries(versions)) {
        if (data.relTicket && data.version && data.folder) {
            ticketData.push({
                packageKey: key,
                ticketId: data.relTicket,
                version: data.version,
                folder: data.folder,
            });
        }
    }

    return ticketData;
}

// Function to validate input JSON
function validateInput(versions) {
    if (typeof versions !== 'object' || versions === null) {
        throw new Error('Input must be a valid JSON object');
    }

    const ticketsWithData = Object.entries(versions).filter(
        ([, data]) => data.relTicket && data.version && data.folder,
    );

    if (ticketsWithData.length === 0) {
        return false;
    }

    console.log(`Found ${ticketsWithData.length} tickets to update instructions for`);
    return true;
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
        const hasTickets = validateInput(versions);

        if (!hasTickets) {
            console.log('No tickets with relTicket IDs found in versions.json - nothing to update, skipping.');
            console.log(
                '\nNo tickets to update instructions for - skipping (this is expected when all functions use skipRelTicket)',
            );
            return;
        }

        // Extract ticket data
        const ticketsToUpdate = extractTicketData(versions);

        console.log(`Processing ${ticketsToUpdate.length} tickets for instruction updates`);

        const results = [];
        const errors = [];

        // Process each ticket
        for (const ticket of ticketsToUpdate) {
            try {
                // Check if this function should skip REL ticket processing
                const shouldSkip = await shouldSkipRelTicket(ticket.folder);
                if (shouldSkip) {
                    console.log(
                        `Skipping ${ticket.packageKey} - marked as skipRelTicket=true (no JIRA instruction update needed)`,
                    );
                    results.push({
                        packageKey: ticket.packageKey,
                        ticketId: ticket.ticketId,
                        version: ticket.version,
                        relComponent: 'skipped-no-rel-ticket',
                        success: true,
                        skipped: true,
                    });
                    continue;
                }

                // Get relComponent from package.json
                const relComponent = await getRelComponent(ticket.folder);

                // Generate deployment instructions
                const deploymentInstructions = generateDeploymentInstructions(
                    ticket.packageKey,
                    ticket.version,
                    ticket.folder,
                    envConfig.targetDeployEnv,
                    ticket.ticketId,
                );

                // For rollback instructions, we'll let the API determine the rollback version
                // by querying the version dashboard using the relComponent
                const rollbackInstructions = generateRollbackInstructions(
                    ticket.packageKey,
                    '{{ROLLBACK_VERSION}}', // Placeholder - API will replace with actual version
                    ticket.folder,
                    envConfig.targetDeployEnv,
                    ticket.ticketId,
                );

                const result = updateJiraInstructions(
                    ticket.ticketId,
                    deploymentInstructions,
                    rollbackInstructions,
                    relComponent,
                    getAwsDeploymentEnv(environment),
                );

                results.push({
                    packageKey: ticket.packageKey,
                    ticketId: ticket.ticketId,
                    version: ticket.version,
                    relComponent: relComponent,
                    success: result.success,
                });

                if (!result.success) {
                    errors.push({
                        packageKey: ticket.packageKey,
                        ticketId: ticket.ticketId,
                        error: result.error,
                    });
                }
            } catch (error) {
                console.error(`\nError processing ticket ${ticket.ticketId}:`, error.message);
                errors.push({
                    packageKey: ticket.packageKey,
                    ticketId: ticket.ticketId,
                    error: error.message,
                });
                results.push({
                    packageKey: ticket.packageKey,
                    ticketId: ticket.ticketId,
                    success: false,
                });
            }
        }

        // Summary
        console.log('\n=== Jira Instruction Update Summary ===');
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        console.log(`\nTotal: ${results.length}`);
        console.log(`Successful: ${successful.length}`);
        console.log(`Failed: ${failed.length}`);

        if (successful.length > 0) {
            console.log(`\nSuccessful instruction updates:`);
            for (const result of successful) {
                if (result.skipped) {
                    console.log(`  ${result.packageKey} (skipped - no REL ticket needed)`);
                } else {
                    console.log(
                        `  ${result.packageKey} -> ${result.ticketId} (${result.relComponent} v${result.version})`,
                    );
                }
            }
        }

        if (failed.length > 0) {
            console.log(`\nFailed instruction updates:`);
            for (const result of failed) {
                const error = errors.find((e) => e.ticketId === result.ticketId);
                console.log(`  ${result.packageKey} -> ${result.ticketId}${error ? `: ${error.error}` : ''}`);
            }
        }

        // Instruction update failures exit with error but pipeline uses allow_failure: true
        if (failed.length > 0) {
            console.log(`\n${failed.length} instruction update(s) failed but pipeline continues (allow_failure: true)`);
            process.exit(1);
        }

        console.log('\nAll instruction updates completed successfully');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
