#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const functionsDir = path.join(__dirname, '..', 'functions');
const output = {};

try {
    const directories = fs
        .readdirSync(functionsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    for (const dirName of directories) {
        const packageJsonPath = path.join(functionsDir, dirName, 'package.json');
        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
                const packageJson = JSON.parse(packageJsonContent);

                if (packageJson.name && packageJson.version) {
                    output[packageJson.name] = {
                        version: packageJson.version,
                        folder: dirName,
                    };
                } else {
                    console.warn(`Skipping directory ${dirName} as package.json is missing 'name' or 'version'.`);
                }
            } else {
                console.warn(`Skipping directory ${dirName} as package.json was not found.`);
            }
        } catch (err) {
            console.error(`Error processing directory ${dirName}: `, err.message);
        }
    }

    process.stdout.write(JSON.stringify(output, null, 4) + '\n');
} catch (err) {
    console.error('Error reading functions directory:', err.message);
    process.exit(1);
}
