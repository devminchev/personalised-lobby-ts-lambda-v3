#!/usr/bin/env node

/**
 * This script maps project names to their corresponding function names
 * from the functions/.mapping file
 *
 * Usage:
 *   node get-function-name.js get-games-function
 *
 * Returns:
 *   get-games
 */

const fs = require('fs');
const path = require('path');

const projectName = process.argv[2];
if (!projectName) {
    console.error('Missing project name argument');
    process.exit(1);
}

// Read the mapping file
try {
    const mappingFile = path.join(__dirname, '..', 'functions', '.mapping');
    const mappingContent = fs.readFileSync(mappingFile, 'utf8');

    // Parse the file
    const mappings = {};
    mappingContent
        .split('\n')
        .filter((line) => line.trim())
        .forEach((line) => {
            const [dirName, funcName] = line.split('=');
            if (dirName && funcName) {
                mappings[dirName.trim()] = funcName.trim();
            }
        });

    // Get the base project name without "-function" suffix
    const baseName = projectName.replace(/-function$/, '');

    // Find the corresponding directory name
    for (const [, funcName] of Object.entries(mappings)) {
        if (funcName === baseName) {
            // Found a match
            console.log(funcName);
            process.exit(0);
        }
    }

    // No match found
    console.error(`No function found for project: ${projectName}`);
    console.error('Available mappings:');
    Object.entries(mappings).forEach(([dirName, funcName]) => {
        console.error(`${dirName} => ${funcName}`);
    });
    process.exit(1);
} catch (err) {
    console.error(`Error reading mapping file: ${err.message}`);
    process.exit(1);
}
