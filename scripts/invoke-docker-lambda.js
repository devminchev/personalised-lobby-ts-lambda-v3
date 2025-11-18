#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Configuration ---
const ROOT_DIR = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, 'env.json');
const MAPPING_FILE = path.join(ROOT_DIR, 'functions', '.mapping');
const SLEEP_DURATION_MS = 3000; // 3 seconds wait for container startup

// --- Helper Functions ---

function log(message) {
    console.log(`[Invoke Script] ${message}`);
}

function errorLog(message) {
    console.error(`[Invoke Script] ERROR: ${message}`);
}

function runCommand(command, options = { stdio: 'inherit' }) {
    log(`Executing: ${command}`);
    try {
        return execSync(command, options);
    } catch (err) {
        errorLog(`Command failed: ${command}`);
        errorLog(err.stderr ? err.stderr.toString() : err.message);
        // Ensure cleanup happens even if a step fails
        throw err; // Re-throw after logging
    }
}

function getEnvFlags() {
    try {
        const envFileContent = fs.readFileSync(ENV_FILE, 'utf8');
        const envData = JSON.parse(envFileContent);
        const params = envData.Parameters || {};
        return Object.entries(params)
            .map(([k, v]) => `--env ${k}=${v}`) // Pass raw value
            .join(' ');
    } catch (error) {
        errorLog(`Failed to read or parse ${ENV_FILE}: ${error.message}`);
        throw error; // Stop execution if env vars can't be loaded
    }
}

function getFunctionDir(projectName) {
    try {
        if (!fs.existsSync(MAPPING_FILE)) {
            errorLog(`${MAPPING_FILE} not found.`);
            throw new Error(`${MAPPING_FILE} not found.`);
        }
        const mappingContent = fs.readFileSync(MAPPING_FILE, 'utf8');
        const lines = mappingContent.split('\n');
        for (const line of lines) {
            const [dir, proj] = line.split('=');
            if (proj && proj.trim() === projectName) {
                return dir.trim();
            }
        }
        errorLog(`Project name '${projectName}' not found in ${MAPPING_FILE}`);
        throw new Error(`Mapping not found for ${projectName}`);
    } catch (error) {
        errorLog(`Failed to read or parse ${MAPPING_FILE}: ${error.message}`);
        throw error;
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Main Execution ---

async function main() {
    const projectName = process.argv[2];
    if (!projectName) {
        errorLog('Project name argument is required.');
        console.error('Usage: node scripts/invoke-docker-lambda.js <project-name>');
        process.exit(1);
    }

    log(`Starting invocation for project: ${projectName}`);

    const containerName = `test-lambda-${projectName}`;
    let envFlags = '';
    let functionDir = '';

    try {
        // 1. Prepare environment and function details
        envFlags = getEnvFlags();
        functionDir = getFunctionDir(projectName);
        const eventFilePath = path.join(ROOT_DIR, 'functions', functionDir, 'events', 'event.json');

        if (!fs.existsSync(eventFilePath)) {
            errorLog(`Event file not found at ${eventFilePath}`);
            throw new Error(`Event file not found: ${eventFilePath}`);
        }

        // 2. Start container detached
        const podmanRunCmd = `podman run -d --name ${containerName} -p 9000:8080 ${envFlags} personalised-lobby/${projectName}:latest`;
        runCommand(podmanRunCmd);

        // 3. Wait for container to initialize
        log(`Waiting ${SLEEP_DURATION_MS / 1000} seconds for container startup...`);
        await sleep(SLEEP_DURATION_MS);

        // 4. Invoke function with curl
        const curlCmd = `curl -s -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" -d @${eventFilePath} | cat`;
        const result = runCommand(curlCmd, { encoding: 'utf8', stdio: 'pipe' }); // Capture output

        // Corrected console.log lines
        console.log('\n--- Lambda Response ---');
        console.log(result.trim() || '[No Response Body]');
        console.log('-----------------------\n');
    } catch (err) {
        // Error already logged in helper functions or during execution
        process.exitCode = 1; // Indicate failure
    } finally {
        // 5. Cleanup: Stop and remove container regardless of success/failure
        log(`Cleaning up container: ${containerName}`);
        try {
            runCommand(`podman rm -f ${containerName}`, { stdio: 'ignore' }); // Ignore output/errors during cleanup
            log(`Container ${containerName} removed.`);
        } catch (cleanupErr) {
            errorLog(`Failed to cleanup container ${containerName}. You may need to remove it manually.`);
            // Don't override original exit code if cleanup fails
            if (!process.exitCode) {
                process.exitCode = 1;
            }
        }
    }

    if (!process.exitCode) {
        log(`Invocation for ${projectName} completed successfully.`);
    } else {
        errorLog(`Invocation for ${projectName} failed.`);
    }
}

main();
