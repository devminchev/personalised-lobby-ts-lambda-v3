#!/usr/bin/env node

const axios = require('axios');

// Configuration - using same base URL as transition script
const JIRA_COMMENT_ENDPOINT = 'http://nja.psnative.pgt.gaia/ticket';

// Environment mapping - maps CI environment names to comment types and display names
const ENVIRONMENT_CONFIG = {
    stg_eu00: { endpoint: 'ppc', displayName: 'NPE' },
    stg_na03: { endpoint: 'ppc', displayName: 'NPE' },
    prod_eu00: { endpoint: 'ppc', displayName: 'PROD' },
    prod_na03: { endpoint: 'ppc', displayName: 'PROD' },
};

// Command line argument parsing
const args = process.argv.slice(2);
const envArg = args.find((arg) => arg.startsWith('--environment='));

if (!envArg) {
    console.error('Error: --environment parameter is required');
    console.error('Usage: ./comment-jira-tickets.js --environment=stg_eu00|stg_na03|prod_eu00|prod_na03');
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

// Function to add comment to a Jira ticket
async function commentJiraTicket(ticketId, version, displayEnvironment, endpoint) {
    const url = `${JIRA_COMMENT_ENDPOINT}/${ticketId}/comment/${endpoint}?additive=true`;
    const payload = {
        environment: displayEnvironment,
        deployable_version: version,
    };

    console.log(`Adding comment to ticket ${ticketId}: Version ${version} deployed to ${displayEnvironment}`);

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                apikey: 'secret',
            },
        });

        console.log(`✓ Successfully added comment to ${ticketId}`);

        return {
            success: true,
            ticketId: ticketId,
            version: version,
            environment: displayEnvironment,
            response: response.data,
        };
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        const statusCode = error.response?.status || 'Unknown';
        console.error(`✗ Failed to add comment to ticket ${ticketId}: HTTP ${statusCode}: ${errorMessage}`);
        return {
            success: false,
            ticketId: ticketId,
            error: `HTTP ${statusCode}: ${errorMessage}`,
        };
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
        throw new Error('No tickets with relTicket IDs found in versions.json');
    }

    console.log(`Found ${ticketsWithRelIds.length} tickets to comment on`);
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

        // Extract ticket data
        const ticketsToComment = extractTicketData(versions);

        console.log(`Processing ${ticketsToComment.length} tickets for deployment comments`);

        const results = [];
        const errors = [];

        // Process each ticket
        for (const ticket of ticketsToComment) {
            try {
                const result = await commentJiraTicket(
                    ticket.ticketId,
                    ticket.version,
                    envConfig.displayName,
                    envConfig.endpoint,
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
                console.log(`  ✓ ${result.packageKey} → ${result.ticketId} (v${result.version})`);
            }
        }

        if (failed.length > 0) {
            console.log(`\nFailed comments:`);
            for (const result of failed) {
                const error = errors.find((e) => e.ticketId === result.ticketId);
                console.log(`  ✗ ${result.packageKey} → ${result.ticketId}${error ? `: ${error.error}` : ''}`);
            }
        }

        // Note: Unlike transitions, comment failures should not fail the pipeline
        // Pipeline jobs should use allow_failure: true for comment jobs
        if (failed.length > 0) {
            console.log(`\n⚠️  ${failed.length} comment(s) failed but pipeline continues (allow_failure: true)`);
            console.log('This job will show as yellow/warning in GitLab CI but will not block the pipeline');
            // Exit with error code to make job show as failed/warning, but pipeline continues due to allow_failure
            process.exit(1);
        }

        console.log(`\n✅ Successfully added deployment comments to ${successful.length} tickets`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
