#!/usr/bin/env node

const { execFileSync } = require('child_process');

// Valid transition states matching NJA's STATE_TO_STATE_NAME constants
const VALID_STATES = {
    DEPLOY_TO_PP: 'Deploy to PP',
    PP_TESTING: 'PP Testing',
    DEPLOYING: 'Deploying',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

// CLI argument to NJA state name mapping
const STATE_MAP = {
    'deploy-pp': VALID_STATES.DEPLOY_TO_PP,
    'pp-testing': VALID_STATES.PP_TESTING,
    deploying: VALID_STATES.DEPLOYING,
    resolved: VALID_STATES.RESOLVED,
    closed: VALID_STATES.CLOSED,
};

// Command line argument parsing
const args = process.argv.slice(2);
const stateArg = args.find((arg) => arg.startsWith('--state='));

if (!stateArg) {
    console.error('Error: --state parameter is required');
    console.error(`Usage: ./transition-jira-tickets.js --state=${Object.keys(STATE_MAP).join('|')}`);
    process.exit(1);
}

const stateParam = stateArg.split('=')[1];
const state = STATE_MAP[stateParam] || null;

if (!state) {
    console.error(`Error: State must be one of: ${Object.keys(STATE_MAP).join(', ')}`);
    process.exit(1);
}

console.log(`Transitioning Jira tickets to state: ${state}`);

// Function to transition a Jira ticket via NJA CLI
function transitionJiraTicket(ticketId, targetState) {
    const cliArgs = ['ticket', 'transition', ticketId, '--state', targetState];

    console.log(`Transitioning ticket ${ticketId} to "${targetState}"`);

    try {
        execFileSync('nja', cliArgs, { encoding: 'utf-8' });
        console.log(`Successfully transitioned ${ticketId} to "${targetState}"`);
        return { success: true, ticketId, state: targetState };
    } catch (error) {
        const stdout = error.stdout || '';
        const stderr = error.stderr || '';
        const errorDetail = stdout || stderr || error.message;
        console.error(`Failed to transition ticket ${ticketId}: ${errorDetail}`);
        return { success: false, ticketId, error: errorDetail };
    }
}

// Function to extract ticket IDs from versions.json
function extractTicketIds(versions) {
    const ticketIds = [];

    for (const [key, data] of Object.entries(versions)) {
        if (data.relTicket) {
            ticketIds.push({
                packageKey: key,
                ticketId: data.relTicket,
                version: data.version,
            });
        }
    }

    return ticketIds;
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

    console.log(`Found ${ticketsWithRelIds.length} tickets to transition`);
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
            console.log('No tickets with relTicket IDs found in versions.json - nothing to transition, skipping.');
            console.log(
                `\nNo tickets to transition to "${state}" - skipping (this is expected when all functions use skipRelTicket)`,
            );
            return;
        }

        // Extract ticket IDs
        const ticketsToTransition = extractTicketIds(versions);

        console.log(`Processing ${ticketsToTransition.length} tickets for transition to "${state}"`);

        const results = [];
        const errors = [];

        // Process each ticket
        for (const ticket of ticketsToTransition) {
            try {
                const result = transitionJiraTicket(ticket.ticketId, state);

                results.push({
                    packageKey: ticket.packageKey,
                    ticketId: ticket.ticketId,
                    version: ticket.version,
                    state: state,
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
        console.log('\n=== Jira Ticket Transition Summary ===');
        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        console.log(`\nTotal: ${results.length}`);
        console.log(`Successful: ${successful.length}`);
        console.log(`Failed: ${failed.length}`);

        if (successful.length > 0) {
            console.log(`\nSuccessful transitions to "${state}":`);
            for (const result of successful) {
                console.log(`  ${result.packageKey} -> ${result.ticketId} (v${result.version})`);
            }
        }

        if (failed.length > 0) {
            console.log(`\nFailed transitions:`);
            for (const result of failed) {
                const error = errors.find((e) => e.ticketId === result.ticketId);
                console.log(`  ${result.packageKey} -> ${result.ticketId}${error ? `: ${error.error}` : ''}`);
            }
        }

        // Exit with error if any transitions failed
        if (failed.length > 0) {
            console.log(`\nPipeline will fail due to ${failed.length} failed transition(s)`);
            process.exit(1);
        }

        console.log(`\nAll ${successful.length} tickets successfully transitioned to "${state}"`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
