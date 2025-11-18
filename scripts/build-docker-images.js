#!/usr/bin/env node

/**
 * This script builds Docker images for all functions using the versions.json file.
 * It will build and push images with semantic versions or fall back to the commit SHA.
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const VERSIONS_FILE = 'versions.json';
const DEFAULT_TAG = process.env.CI_COMMIT_SHA || 'latest';

// Utility to execute commands and log output
function runCommand(command) {
    console.log(`Running: ${command}`);
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(`Command failed with exit code ${error.status}`);
        return false;
    }
}

// Main function to build docker images
function buildDockerImages() {
    console.log('Building Docker images for all functions...');

    // Check if versions.json exists
    if (!fs.existsSync(VERSIONS_FILE)) {
        console.error(
            `Error: ${VERSIONS_FILE} not found. Semantic versioning job failed or did not produce the versions file.`,
        );
        process.exit(1);
    }

    // Read and parse versions.json
    try {
        const versionsData = JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));
        console.log('Found versions.json:');
        console.log(JSON.stringify(versionsData, null, 2));

        // Track results
        let successful = 0;
        let failed = 0;

        // Process each project
        for (const projectName in versionsData) {
            const projectData = versionsData[projectName];
            console.log(`\nProcessing project: ${projectName}...`);

            // Extract version and folder
            const { version, folder } = projectData;
            const tag = version || DEFAULT_TAG;

            console.log(`Building Docker image for ${projectName} (folder: ${folder}) with tag: ${tag}`);

            // Build and push Docker image
            let buildSuccess = runCommand(`TAG=${tag} yarn nx run ${projectName}:docker:production`);

            if (buildSuccess) {
                console.log(`Successfully built image for ${projectName} with tag ${tag}`);

                // Push the image
                let pushSuccess = runCommand(`TAG=${tag} yarn nx run ${projectName}:docker-push`);

                if (pushSuccess) {
                    console.log(`Successfully pushed image for ${projectName} with tag ${tag}`);
                    successful++;
                } else {
                    console.error(`Failed to push image for ${projectName}`);
                    failed++;
                }
            } else {
                console.error(`Failed to build image for ${projectName}`);
                failed++;
            }
        }

        // Print summary
        console.log('\n===== BUILD SUMMARY =====');
        console.log(`Total projects: ${Object.keys(versionsData).length}`);
        console.log(`Successfully built and pushed: ${successful}`);
        console.log(`Failed: ${failed}`);

        if (failed > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error(`Error parsing ${VERSIONS_FILE}:`, error.message);
        process.exit(1);
    }
}

// Run the builder
buildDockerImages();
