#!/usr/bin/env node

const axios = require('axios');

// Configuration - using same base URL as found in nja-rel-pipelines-v3
const JIRA_TRANSITION_ENDPOINT = 'http://nja.psnative.pgt.gaia/ticket';

// Valid transition states from nja-rel-pipelines-v3/src/lib/transitions/constants.ts
const VALID_STATES = {
    DEPLOY_TO_PP: 'Deploy to PP',
    PP_TESTING: 'PP Testing',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

// Command line argument parsing
const args = process.argv.slice(2);
const stateArg = args.find((arg) => arg.startsWith('--state='));

if (!stateArg) {
    console.error('Error: --state parameter is required');
    console.error('Usage: ./transition-jira-tickets.js --state=deploy-pp|pp-testing|resolved|closed');
    process.exit(1);
}

const stateParam = stateArg.split('=')[1];
const state =
    stateParam === 'deploy-pp'
        ? VALID_STATES.DEPLOY_TO_PP
        : stateParam === 'pp-testing'
          ? VALID_STATES.PP_TESTING
          : stateParam === 'resolved'
            ? VALID_STATES.RESOLVED
            : stateParam === 'closed'
              ? VALID_STATES.CLOSED
              : null;

if (!state) {
    console.error('Error: State must be one of: deploy-pp, pp-testing, resolved, closed');
    process.exit(1);
}

console.log(`Transitioning Jira tickets to state: ${state}`);

// Function to transition a Jira ticket
async function transitionJiraTicket(ticketId, targetState) {
    const url = `${JIRA_TRANSITION_ENDPOINT}/${ticketId}/transition`;
    const payload = {
        state: targetState,
    };

    console.log(`Transitioning ticket ${ticketId} to "${targetState}"`);

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                apikey: 'secret',
            },
        });

        console.log(`✓ Successfully transitioned ${ticketId} to "${targetState}"`);

        return {
            success: true,
            ticketId: ticketId,
            state: targetState,
            response: response.data,
        };
    } catch (error) {
        const errorMessage = error.response?.data || error.message;
        const statusCode = error.response?.status || 'Unknown';
        console.error(`✗ Failed to transition ticket ${ticketId}: HTTP ${statusCode}: ${errorMessage}`);
        return {
            success: false,
            ticketId: ticketId,
            error: `HTTP ${statusCode}: ${errorMessage}`,
        };
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
        throw new Error('No tickets with relTicket IDs found in versions.json');
    }

    console.log(`Found ${ticketsWithRelIds.length} tickets to transition`);
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

        // Extract ticket IDs
        const ticketsToTransition = extractTicketIds(versions);

        console.log(`Processing ${ticketsToTransition.length} tickets for transition to "${state}"`);

        const results = [];
        const errors = [];

        // Process each ticket
        for (const ticket of ticketsToTransition) {
            try {
                const result = await transitionJiraTicket(ticket.ticketId, state);

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
                console.log(`  ✓ ${result.packageKey} → ${result.ticketId} (v${result.version})`);
            }
        }

        if (failed.length > 0) {
            console.log(`\nFailed transitions:`);
            for (const result of failed) {
                const error = errors.find((e) => e.ticketId === result.ticketId);
                console.log(`  ✗ ${result.packageKey} → ${result.ticketId}${error ? `: ${error.error}` : ''}`);
            }
        }

        // Exit with error if any transitions failed (requirement: pipeline should stop on failure)
        if (failed.length > 0) {
            console.log(`\n💥 Pipeline will fail due to ${failed.length} failed transition(s)`);
            process.exit(1);
        }

        console.log(`\n✅ All ${successful.length} tickets successfully transitioned to "${state}"`);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
