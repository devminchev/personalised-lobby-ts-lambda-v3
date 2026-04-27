#!/usr/bin/env node

const { execFileSync } = require('child_process');

// Environment mapping - maps CI environment names to NJA CLI command and display names
const ENVIRONMENT_CONFIG = {
    stg_eu00: { command: 'comment-ppc', displayName: 'NPE' },
    stg_eu03: { command: 'comment-ppc', displayName: 'NPE' },
    stg_na03: { command: 'comment-ppc', displayName: 'NPE' },
    prod_eu00: { command: 'comment-live', displayName: 'PROD' },
    prod_eu03: { command: 'comment-live', displayName: 'PROD' },
    prod_na03: { command: 'comment-live', displayName: 'PROD' },
};

// Command line argument parsing
const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith('--environment='));

if (!envArg) {
    console.error('Error: --environment parameter is required');
    console.error(
        'Usage: ./comment-jira-tickets.js --environment=stg_eu00|stg_eu03|stg_na03|prod_eu00|prod_eu03|prod_na03',
    );
    process.exit(1);
}

const environment = envArg.split('=')[1];
const envConfig = ENVIRONMENT_CONFIG[environment];

if (!envConfig) {
    console.error(`Error: Environment must be one of: ${Object.keys(ENVIRONMENT_CONFIG).join(', ')}`);
    process.exit(1);
}

console.log(
    `Adding deployment comments for environment: ${environment} (automation service environment: ${envConfig.displayName})`,
);

// Function to add comment to a Jira ticket via NJA CLI
function commentJiraTicket(ticketId, version, displayEnvironment, command) {
    const cliArgs = ['ticket', command, ticketId, '--environment', displayEnvironment, '--deployable-version', version];

    // PPC comments use --additive; live comments require --stage
    if (command === 'comment-ppc') {
        cliArgs.push('--additive');
    } else if (command === 'comment-live') {
        cliArgs.push('--stage', 'POST_DEPLOY');
    }

    console.log(`Adding comment to ticket ${ticketId}: Version ${version} deployed to ${displayEnvironment}`);

    try {
        execFileSync('nja', cliArgs, { encoding: 'utf-8' });
        console.log(`Successfully added comment to ${ticketId}`);
        return { success: true, ticketId, version, environment: displayEnvironment };
    } catch (error) {
        const stdout = error.stdout || '';
        const stderr = error.stderr || '';
        const errorDetail = stdout || stderr || error.message;
        console.error(`Failed to add comment to ticket ${ticketId}: ${errorDetail}`);
        return { success: false, ticketId, error: errorDetail };
    }
}

// Function to extract ticket IDs and versions from versions.json
function extractTicketData(versions) {
    const ticketData = [];

    for (const [key, data] of Object.entries(versions)) {
        if (data.relTicket && data.version) {
            ticketData.push({
                packageKey: key,
                ticketId: data.relTicket,
                version: data.version,
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

    const ticketsWithRelIds = Object.entries(versions).filter(([, data]) => data.relTicket);

    if (ticketsWithRelIds.length === 0) {
        return false;
    }

    console.log(`Found ${ticketsWithRelIds.length} tickets to comment on`);
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
            console.log('No tickets with relTicket IDs found in versions.json - nothing to comment on, skipping.');
            console.log(
                '\nNo tickets to add comments to - skipping (this is expected when all functions use skipRelTicket)',
            );
            return;
        }

        // Extract ticket data
        const ticketsToComment = extractTicketData(versions);

        console.log(`Processing ${ticketsToComment.length} tickets for deployment comments`);

        const results = [];
        const errors = [];

        // Process each ticket
        for (const ticket of ticketsToComment) {
            try {
                const result = commentJiraTicket(
                    ticket.ticketId,
                    ticket.version,
                    envConfig.displayName,
                    envConfig.command,
                );

                results.push({
                    packageKey: ticket.packageKey,
                    ticketId: ticket.ticketId,
                    version: ticket.version,
                    environment: envConfig.displayName,
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
        console.log('\n=== Jira Ticket Comment Summary ===');
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        console.log(`\nTotal: ${results.length}`);
        console.log(`Successful: ${successful.length}`);
        console.log(`Failed: ${failed.length}`);

        if (successful.length > 0) {
            console.log(`\nSuccessful comments added for "${envConfig.displayName}" environment:`);
            for (const result of successful) {
                console.log(`  ${result.packageKey} -> ${result.ticketId} (v${result.version})`);
            }
        }

        if (failed.length > 0) {
            console.log(`\nFailed comments:`);
            for (const result of failed) {
                const error = errors.find((e) => e.ticketId === result.ticketId);
                console.log(`  ${result.packageKey} -> ${result.ticketId}${error ? `: ${error.error}` : ''}`);
            }
        }

        // Comment failures exit with error but pipeline uses allow_failure: true
        if (failed.length > 0) {
            console.log(`\n${failed.length} comment(s) failed but pipeline continues (allow_failure: true)`);
            process.exit(1);
        }

        console.log(`\nSuccessfully added deployment comments to ${successful.length} tickets`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
