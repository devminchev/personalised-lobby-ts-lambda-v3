#!/usr/bin/env node

/**
 * This script updates all library versions in the root package.json
 * to match the versions in their respective package.json files.
 * It should be run after versioning to ensure that the root package.json
 * always references the correct library versions.
 * It also commits the change.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get workspace root - works regardless of where script is executed from
const findWorkspaceRoot = (startPath) => {
    let currentPath = startPath;
    while (currentPath !== '/') {
        if (fs.existsSync(path.join(currentPath, 'nx.json'))) {
            return currentPath;
        }
        currentPath = path.dirname(currentPath);
    }
    throw new Error('Could not find workspace root with nx.json');
};

const workspaceRoot = findWorkspaceRoot(process.cwd());
const rootPackageJsonPath = path.join(workspaceRoot, 'package.json');
const libsDir = path.join(workspaceRoot, 'libs');

console.log(`Updating library versions in root package.json...`);
console.log(`Workspace root: ${workspaceRoot}`);
console.log(`Root package.json: ${rootPackageJsonPath}`);

try {
    // Read root package.json
    const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

    // Track if any changes were made
    let librariesUpdated = false;

    // Get all directories in the libs folder
    const libraryDirs = fs
        .readdirSync(libsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    console.log(`Found ${libraryDirs.length} potential libraries in libs directory`);

    // Process each library
    for (const libName of libraryDirs) {
        const libPackageJsonPath = path.join(libsDir, libName, 'package.json');

        // Skip directories without package.json
        if (!fs.existsSync(libPackageJsonPath)) {
            console.log(`Skipping ${libName} - no package.json found`);
            continue;
        }

        // Read the library's package.json
        const libPackageJson = JSON.parse(fs.readFileSync(libPackageJsonPath, 'utf8'));

        // Skip if no name or version
        if (!libPackageJson.name || !libPackageJson.version) {
            console.log(`Skipping ${libName} - name or version missing in package.json`);
            continue;
        }

        // Get the library's published name and version
        const packageName = libPackageJson.name;
        const packageVersion = libPackageJson.version;

        // Check if this library is in root dependencies
        if (rootPackageJson.dependencies && rootPackageJson.dependencies[packageName] !== undefined) {
            // Update the version in root package.json
            const oldVersion = rootPackageJson.dependencies[packageName];
            rootPackageJson.dependencies[packageName] = packageVersion;

            console.log(`Updated ${packageName} from ${oldVersion} to ${packageVersion}`);
            librariesUpdated = true;
        } else {
            console.log(`Skipping ${packageName} - not found in root dependencies`);
        }
    }

    if (librariesUpdated) {
        // Write the updated package.json back to disk
        fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2) + '\n');
        console.log(`Updated library versions in root package.json`);

        // Stage and commit the change
        console.log(`Staging and committing ${rootPackageJsonPath}...`);
        execSync(`git add ${rootPackageJsonPath}`, { cwd: workspaceRoot, stdio: 'inherit' });
        execSync(`git commit -m "chore: sync library versions to root package.json [skip ci]" --no-verify`, {
            cwd: workspaceRoot,
            stdio: 'inherit',
        });
        console.log('Root package.json committed successfully.');
    } else {
        console.log('No library versions needed updating in root package.json');
    }
} catch (error) {
    console.error('Error updating or committing library versions:', error);
    process.exit(1);
}
