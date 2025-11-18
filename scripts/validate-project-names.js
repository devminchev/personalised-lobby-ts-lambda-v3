#!/usr/bin/env node

/**
 * This script validates project names across all functions and libraries
 * by checking consistency between package.json and project.json files.
 * It also ensures the functions/.mapping file contains all appropriate entries.
 *
 * Usage:
 *   node validate-project-names.js
 *
 * Behavior:
 *   - Reports inconsistencies between package.json and project.json names
 *   - Exits with error code 1 if inconsistencies are found
 *   - Updates functions/.mapping file if all names are consistent
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const FUNCTIONS_DIR = path.join(ROOT_DIR, 'functions');
const LIBS_DIR = path.join(ROOT_DIR, 'libs');
const MAPPING_FILE = path.join(FUNCTIONS_DIR, '.mapping');

// Utility functions
const readJsonFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return null;
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
        return null;
    }
};

const getFolderDirectories = (parentDir) => {
    try {
        if (!fs.existsSync(parentDir)) {
            console.warn(`Directory does not exist: ${parentDir}`);
            return [];
        }

        return fs
            .readdirSync(parentDir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
    } catch (error) {
        console.error(`Error reading directory ${parentDir}: ${error.message}`);
        return [];
    }
};

// Get existing mappings from the .mapping file
const getExistingMappings = () => {
    try {
        if (!fs.existsSync(MAPPING_FILE)) {
            return {};
        }

        const content = fs.readFileSync(MAPPING_FILE, 'utf8');
        const mappings = {};

        content
            .split('\n')
            .filter((line) => line.trim())
            .forEach((line) => {
                const [dirName, funcName] = line.split('=');
                if (dirName && funcName) {
                    mappings[dirName.trim()] = funcName.trim();
                }
            });

        return mappings;
    } catch (error) {
        console.error(`Error reading mapping file: ${error.message}`);
        return {};
    }
};

// Update the .mapping file with new entries
const updateMappingFile = (mappings) => {
    try {
        const content = Object.entries(mappings)
            .map(([dirName, projectName]) => `${dirName}=${projectName}`)
            .join('\n');

        fs.writeFileSync(MAPPING_FILE, content + '\n');
        console.log(`Updated ${MAPPING_FILE} with ${Object.keys(mappings).length} entries`);
    } catch (error) {
        console.error(`Error updating mapping file: ${error.message}`);
        process.exit(1);
    }
};

// Main function
const main = () => {
    const functionDirs = getFolderDirectories(FUNCTIONS_DIR);
    const libDirs = getFolderDirectories(LIBS_DIR);

    console.log(`Found ${functionDirs.length} functions and ${libDirs.length} libraries`);

    const inconsistencies = [];
    const validProjects = {};
    const missingFiles = [];

    // Process functions
    functionDirs.forEach((dirName) => {
        const dirPath = path.join(FUNCTIONS_DIR, dirName);
        const packageJsonPath = path.join(dirPath, 'package.json');
        const projectJsonPath = path.join(dirPath, 'project.json');

        const packageJson = readJsonFile(packageJsonPath);
        const projectJson = readJsonFile(projectJsonPath);

        if (!packageJson || !projectJson) {
            missingFiles.push({
                directory: dirPath,
                packageJson: !!packageJson,
                projectJson: !!projectJson,
            });
            return;
        }

        const packageName = packageJson.name;
        const projectName = projectJson.name;

        if (packageName !== projectName) {
            inconsistencies.push({
                directory: dirPath,
                packageName,
                projectName,
            });
        } else {
            // This is a valid project with consistent naming
            validProjects[dirName] = projectName;
        }
    });

    // Process libraries
    libDirs.forEach((dirName) => {
        const dirPath = path.join(LIBS_DIR, dirName);
        const packageJsonPath = path.join(dirPath, 'package.json');
        const projectJsonPath = path.join(dirPath, 'project.json');

        const packageJson = readJsonFile(packageJsonPath);
        const projectJson = readJsonFile(projectJsonPath);

        if (!packageJson || !projectJson) {
            missingFiles.push({
                directory: dirPath,
                packageJson: !!packageJson,
                projectJson: !!projectJson,
            });
            return;
        }

        const packageName = packageJson.name;
        const projectName = projectJson.name;

        if (packageName !== projectName) {
            inconsistencies.push({
                directory: dirPath,
                packageName,
                projectName,
            });
        } else {
            // This is a valid library with consistent naming
            // Include all libraries in the valid projects list
            validProjects[dirName] = projectName;
        }
    });

    // Report missing files if any
    if (missingFiles.length > 0) {
        console.error('\n⚠️ Missing package.json or project.json files:');
        missingFiles.forEach(({ directory, packageJson, projectJson }) => {
            console.error(`
  Directory: ${directory.replace(ROOT_DIR, '')}
  package.json: ${packageJson ? 'Present' : 'Missing'}
  project.json: ${projectJson ? 'Present' : 'Missing'}
      `);
        });
    }

    // Report inconsistencies if found
    let exitWithError = false;

    if (inconsistencies.length > 0) {
        exitWithError = true;
        console.error('\n⚠️ Inconsistent project names found:');
        inconsistencies.forEach(({ directory, packageName, projectName }) => {
            console.error(`
  Directory: ${directory.replace(ROOT_DIR, '')}
  package.json name: ${packageName || 'N/A'}
  project.json name: ${projectName || 'N/A'}
      `);
        });

        console.error(`
Please fix the inconsistencies above by updating either package.json or project.json
to ensure names match across both files.
    `);
    }

    // If we have any inconsistencies, exit now
    if (exitWithError) {
        process.exit(1);
    }

    // If we get here, all names are consistent - update mapping file
    console.log('✓ All project names are consistent');

    // Get existing mappings
    const existingMappings = getExistingMappings();

    // Compare with valid projects
    let hasChanges = false;
    const updatedMappings = { ...existingMappings };

    // Add entries for new projects or update changed projects
    Object.entries(validProjects).forEach(([dirName, projectName]) => {
        if (!existingMappings[dirName] || existingMappings[dirName] !== projectName) {
            updatedMappings[dirName] = projectName;
            hasChanges = true;
            console.log(`Added/Updated mapping: ${dirName} => ${projectName}`);
        }
    });

    // Remove entries for projects that no longer exist
    Object.keys(existingMappings).forEach((dirName) => {
        if (!validProjects[dirName]) {
            console.log(`Removing outdated mapping: ${dirName} => ${existingMappings[dirName]}`);
            delete updatedMappings[dirName];
            hasChanges = true;
        }
    });

    // Update mapping file if changes were made
    if (hasChanges) {
        updateMappingFile(updatedMappings);
        console.log('✓ .mapping file updated successfully');
    } else {
        console.log('✓ .mapping file is already up to date');
    }

    console.log('\nValidation completed successfully');
};

// Execute the main function
main();
