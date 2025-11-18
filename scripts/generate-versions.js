#!/usr/bin/env node

/**
 * This script generates a versions.json file containing project names,
 * versions, and folder names for all functions in the monorepo.
 * It reads version information from package.json files.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FUNCTIONS_DIR = 'functions';
const OUTPUT_FILE = 'versions.json';
const AFFECTED_PROJECTS_FILE = 'affected_projects.txt'; // Input file

// Utility to check if directory exists
function directoryExists(dirPath) {
    try {
        return fs.statSync(dirPath).isDirectory();
    } catch (err) {
        return false;
    }
}

// Function to read affected projects
function readAffectedProjects() {
    try {
        if (!fs.existsSync(AFFECTED_PROJECTS_FILE)) {
            console.error(
                `Error: Affected projects file '${AFFECTED_PROJECTS_FILE}' not found. Cannot determine which projects to include.`,
            );
            // Exit or return an empty set/error indicator? Let's exit to prevent generating incorrect full list.
            process.exit(1);
        }
        const content = fs.readFileSync(AFFECTED_PROJECTS_FILE, 'utf8').trim();
        if (!content) {
            console.log(`${AFFECTED_PROJECTS_FILE} is empty. No projects were versioned.`);
            return new Set(); // Return empty set if file is empty
        }
        const projects = content
            .split('\n')
            .map((p) => p.trim())
            .filter(Boolean);
        console.log(`Read ${projects.length} affected projects from ${AFFECTED_PROJECTS_FILE}: ${projects.join(', ')}`);
        return new Set(projects);
    } catch (err) {
        console.error(`Error reading ${AFFECTED_PROJECTS_FILE}: ${err.message}`);
        process.exit(1); // Exit on read error
    }
}

// Main function
function generateVersionsJson() {
    console.log(`Generating ${OUTPUT_FILE} for affected projects read from ${AFFECTED_PROJECTS_FILE}...`);

    const affectedProjects = readAffectedProjects();

    if (affectedProjects.size === 0) {
        console.log('No affected projects found. Generating empty versions.json.');
        // Write an empty JSON object
        try {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify({}, null, 2));
            console.log(`Generated empty ${OUTPUT_FILE}.`);
        } catch (err) {
            console.error(`Error writing empty ${OUTPUT_FILE}: ${err.message}`);
            process.exit(1);
        }
        return; // Exit early
    }

    try {
        const functionsPath = path.join(process.cwd(), FUNCTIONS_DIR);

        if (!directoryExists(functionsPath)) {
            console.error(`Error: Functions directory '${FUNCTIONS_DIR}' not found!`);
            process.exit(1);
        }

        let functionFolders;
        try {
            functionFolders = fs
                .readdirSync(functionsPath)
                .filter((item) => directoryExists(path.join(functionsPath, item)));

            if (functionFolders.length === 0) {
                console.warn(`Warning: No function folders found in ${FUNCTIONS_DIR}`);
            }
        } catch (err) {
            console.error(`Error reading functions directory: ${err.message}`);
            process.exit(1);
        }

        // Object to store function data
        const versions = {};

        // Process each function folder
        functionFolders.forEach((folderName) => {
            const folderPath = path.join(functionsPath, folderName);
            const packageJsonPath = path.join(folderPath, 'package.json');

            if (fs.existsSync(packageJsonPath)) {
                try {
                    const fileContent = fs.readFileSync(packageJsonPath, 'utf8');

                    // Check for empty file
                    if (!fileContent.trim()) {
                        console.error(`Error: ${packageJsonPath} is empty`);
                        return;
                    }

                    const packageJson = JSON.parse(fileContent);
                    const projectName = packageJson.name;
                    const version = packageJson.version;

                    if (!projectName) {
                        console.warn(`Warning: Missing project name in ${packageJsonPath}`);
                        return;
                    }

                    if (!version) {
                        console.warn(`Warning: Missing version in ${packageJsonPath} for project ${projectName}`);
                        return;
                    }

                    if (version === '0.0.0') {
                        console.warn(`Warning: Project ${projectName} has version 0.0.0, skipping`);
                        return;
                    }

                    if (affectedProjects.has(projectName)) {
                        versions[projectName] = {
                            version,
                            folder: folderName,
                        };
                        console.log(
                            `Included affected project ${projectName} (version ${version}) in folder ${folderName}`,
                        );
                    } else {
                        // Optionally log skipped projects, might be verbose
                        // console.log(`Skipping unaffected project ${projectName}`);
                    }
                } catch (err) {
                    console.error(`Error parsing package.json for ${folderName}: ${err.message}`);
                }
            } else {
                console.warn(`Warning: No package.json found for ${folderName}`);
            }
        });

        // Check if any *affected* versions were found (sanity check)
        if (Object.keys(versions).length === 0) {
            console.warn(
                'Warning: No package.json files found corresponding to affected projects. versions.json will be empty.',
            );
        }

        // Write the versions.json file
        try {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(versions, null, 2));
            console.log(`Generated ${OUTPUT_FILE} with ${Object.keys(versions).length} projects`);
            console.log('Content:');
            console.log(JSON.stringify(versions, null, 2));
        } catch (err) {
            console.error(`Error writing ${OUTPUT_FILE}: ${err.message}`);
            process.exit(1);
        }

        return versions;
    } catch (err) {
        console.error(`Unexpected error: ${err.message}`);
        process.exit(1);
    }
}

// Run the generator
generateVersionsJson();
