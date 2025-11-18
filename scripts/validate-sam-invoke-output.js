#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of strings indicating a definite SAM/runtime failure
const ERROR_INDICATORS = [
    '[ERROR]', // General error marker from SAM/runtime
    'Traceback', // Python stack trace indicator
    'Task timed out', // Lambda timeout error
    'module not found', // Common Node.js import error message fragment
    'ImportModuleError', // Specific Node.js import error type
    'Error: Cannot find module', // Specific Node.js import error
    'Invoke Error', // General SAM invoke error
    'panic:', // Go panic indicator
    '"errorType"', // Often present in Lambda error JSON payloads
    'Sandbox.Failure', // SAM sandbox failure
];

/**
 * Checks the entire log content for known error strings.
 * @param {string} logContent - The full log output.
 * @returns {boolean} True if an error indicator is found, false otherwise.
 */
function containsSamErrors(logContent) {
    for (const indicator of ERROR_INDICATORS) {
        if (logContent.includes(indicator)) {
            console.error(`Error: Found SAM/runtime error indicator: "${indicator}"`);
            return true;
        }
    }
    return false;
}

/**
 * Attempts to find and parse the JSON payload at the end of the log output.
 * @param {string} logContent - The full log output.
 * @returns {boolean} True if a valid JSON payload is found and parsed, false otherwise.
 */
function findAndParseJsonPayload(logContent) {
    const lines = logContent.trim().split('\n');
    let potentialJson = '';
    for (let i = lines.length - 1; i >= 0; i--) {
        const trimmedLine = lines[i].trim();

        // Heuristic: Stop if we encounter likely non-JSON SAM log lines *before* finding JSON start
        if (
            potentialJson === '' &&
            (trimmedLine.startsWith('START RequestId:') ||
                trimmedLine.startsWith('END RequestId:') ||
                trimmedLine.startsWith('REPORT RequestId:'))
        ) {
            break; // Stop searching upwards if we hit standard logs before any JSON content
        }

        // Heuristic: Ignore blank lines between JSON lines but stop if blank line precedes JSON start
        if (trimmedLine === '' && potentialJson !== '') continue; // Allow blank lines within multi-line JSON
        if (trimmedLine === '' && potentialJson === '') break; // Stop if blank line before JSON start

        potentialJson = trimmedLine + potentialJson; // Prepend the line

        // Attempt to parse if it looks like the start of a JSON object/array
        if (trimmedLine.startsWith('{') || trimmedLine.startsWith('[')) {
            try {
                JSON.parse(potentialJson);
                console.log('Successfully parsed JSON payload.');
                return true; // Success
            } catch (e) {
                if (e instanceof SyntaxError) {
                    // Continue building the potential JSON string upwards
                    continue;
                } else {
                    console.error('Error: Unexpected parsing error:', e);
                    return false; // Unexpected error during parsing
                }
            }
        }
    }

    // If loop finishes without successfully parsing JSON
    console.error('Error: Could not find or parse a valid JSON payload at the end of the output.');
    if (potentialJson) {
        console.error(
            'Last potential block examined:',
            potentialJson.substring(0, 500) + (potentialJson.length > 500 ? '...' : ''),
        );
    }
    return false;
}

// --- Main Execution ---
if (process.argv.length < 3) {
    console.error('Usage: node validate-sam-invoke-output.js <path/to/output-file>');
    process.exit(1);
}

const outputFilePath = process.argv[2];
const fileName = path.basename(outputFilePath);

if (!fs.existsSync(outputFilePath)) {
    console.error(`Error: File not found: ${outputFilePath}`);
    process.exit(1);
}

try {
    const logContent = fs.readFileSync(outputFilePath, 'utf8');

    // 1. Check for explicit SAM/runtime errors first
    if (containsSamErrors(logContent)) {
        console.error(`Validation failed for: ${fileName} (SAM/runtime error detected)`);
        process.exit(1); // Failure due to error indicators
    }

    // 2. If no errors found, check for a valid JSON payload
    if (findAndParseJsonPayload(logContent)) {
        console.log(`Validation successful for: ${fileName}`);
        process.exit(0); // Success
    } else {
        console.error(`Validation failed for: ${fileName} (Could not parse valid JSON payload)`);
        process.exit(1); // Failure due to missing/invalid JSON
    }
} catch (error) {
    console.error(`An unexpected error occurred while processing ${fileName}:`, error);
    process.exit(1); // General failure
}
