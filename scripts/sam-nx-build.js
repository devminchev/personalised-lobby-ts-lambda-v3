#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for prettier output
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    bgBlue: '\x1b[44m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

// Utility function to format output messages
const format = {
    header: (text) => `${colors.bold}${colors.blue} SAM-NX ${colors.reset}${colors.white} ${text}${colors.reset}`,
    task: (text) => `${colors.dim}   ✔ ${colors.reset} ${text}`,
    success: (text) => `${colors.green}✓ ${colors.reset}${text}`,
    info: (text) => `${colors.blue}ℹ ${colors.reset}${text}`,
    warning: (text) => `${colors.yellow}⚠ ${colors.reset}${text}`,
    error: (text) => `${colors.red}✗ ${colors.reset}${text}`,
    divider: () => `${colors.dim}${'─'.repeat(100)}${colors.reset}`,
};

// Get function or layer names from command line arguments (all arguments after the script name)
const resourceNames = process.argv.slice(2);

if (resourceNames.length === 0) {
    console.error(format.error('At least one resource name (function or layer) must be provided'));
    process.exit(1);
}

// Set the workspace root
const workspaceRoot = path.resolve(__dirname, '..');

// Read the mapping file to map directory names to project names
const mappingFilePath = path.join(workspaceRoot, 'functions', '.mapping');
let nameMapping = {};

try {
    const mappingContent = fs.readFileSync(mappingFilePath, 'utf8');
    mappingContent.split('\n').forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [dirName, projectName] = trimmedLine.split('=');
            if (dirName && projectName) {
                nameMapping[dirName.trim()] = projectName.trim();
            }
        }
    });
} catch (error) {
    console.error(format.error(`Error reading mapping file: ${error.message}`));
    process.exit(1);
}

console.log(format.header(`Starting build for ${resourceNames.length} resource(s)`));
console.log(format.divider());

// Track successful builds
const successfulBuilds = [];

// Process each resource name sequentially
for (const resourceName of resourceNames) {
    try {
        console.log(
            `\n${colors.bold}${colors.magenta} RESOURCE ${colors.reset}  ${colors.bold}${resourceName}${colors.reset}`,
        );

        // Get the NX project name from the mapping
        const projectName = nameMapping[resourceName];
        if (!projectName) {
            console.error(
                format.error(`No mapping found for ${resourceName}. Please add it to the functions/.mapping file.`),
            );
            process.exit(1);
        }

        // Determine if this is a layer or a function
        const isLayer = resourceName.includes('Layer');

        // Execute nx build with the target project
        console.log(format.info(`Building ${colors.bold}${projectName}${colors.reset} with Nx...`));
        execSync(`npx nx build ${projectName}`, {
            cwd: workspaceRoot,
            stdio: 'inherit',
            env: {
                ...process.env,
                // Ensure Nx can find the workspace
                NX_WORKSPACE_ROOT: workspaceRoot,
            },
        });

        // Determine appropriate source and target directories based on resource type
        let sourceDir, targetDir;

        if (isLayer) {
            // For layers, the source is in dist/libs
            // Extract the library name from the resource name
            const libName = resourceName.replace(/Layer$/, '');
            sourceDir = path.join(workspaceRoot, 'dist', 'libs', libName);

            // Layers in SAM need a specific structure with nodejs/node_modules folder
            targetDir = path.join(workspaceRoot, '.aws-sam', 'build', resourceName, 'nodejs');
        } else {
            // For functions, source is in dist/functions
            sourceDir = path.join(workspaceRoot, 'dist', 'functions', resourceName);
            targetDir = path.join(workspaceRoot, '.aws-sam', 'build', resourceName);
        }

        // Create target directory if it doesn't exist
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        // For layers, create the node_modules directory structure required by Lambda layers
        if (isLayer) {
            const nodeModulesPath = path.join(targetDir, 'node_modules');
            if (!fs.existsSync(nodeModulesPath)) {
                fs.mkdirSync(nodeModulesPath, { recursive: true });
            }

            // Extract the package name from the package.json
            const packageJsonPath = path.join(
                workspaceRoot,
                'libs',
                resourceName.replace(/Layer$/, ''),
                'package.json',
            );
            let packageName;

            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                packageName = packageJson.name;
            } else {
                // Fall back to project name if package.json doesn't exist
                packageName = projectName;
            }

            const packageDir = path.join(nodeModulesPath, packageName);

            // Create package directory inside node_modules
            if (!fs.existsSync(packageDir)) {
                fs.mkdirSync(packageDir, { recursive: true });
            }

            // Copy build output to the package directory
            console.log(format.task(`Copying output to SAM layer directory`));
            if (fs.existsSync(sourceDir)) {
                copyDir(sourceDir, packageDir, { ignoreFiles: ['yarn.lock'] });
            } else {
                console.error(
                    format.error(`Source directory ${sourceDir} does not exist. Check if the build succeeded.`),
                );
                process.exit(1);
            }

            // Copy package.json to the layer's package directory
            if (fs.existsSync(packageJsonPath)) {
                fs.copyFileSync(packageJsonPath, path.join(packageDir, 'package.json'));
            }
        } else {
            // Copy function build output - this should include all bundled dependencies
            console.log(format.task(`Copying bundled output to SAM build directory`));
            copyDir(sourceDir, targetDir, { ignoreFiles: ['yarn.lock'] });

            // Copy package.json for reference but don't install dependencies
            // The bundle should already include all dependencies
            const packageJsonPath = path.join(workspaceRoot, 'functions', resourceName, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                console.log(format.task(`Copying package.json for reference`));
                fs.copyFileSync(packageJsonPath, path.join(targetDir, 'package.json'));
            }
        }

        successfulBuilds.push(resourceName);
        console.log(format.success(`Build completed for ${resourceName}`));
    } catch (error) {
        console.error(format.error(`Build failed for ${resourceName}: ${error.message}`));
        process.exit(1);
    }
}

console.log('\n' + format.divider());
console.log(format.header(`Successfully built ${successfulBuilds.length} resource(s)`));

// Display the list of successfully built resources
if (successfulBuilds.length > 0) {
    console.log();
    successfulBuilds.forEach((name) => {
        console.log(format.success(`${name}`));
    });
}

// Directory copy function with options to ignore specific files
function copyDir(source, target, options = {}) {
    const { ignoreFiles = [] } = options;

    // Create target directory if it doesn't exist
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    // Read source directory
    const entries = fs.readdirSync(source, { withFileTypes: true });

    // Copy each entry
    for (const entry of entries) {
        // Skip files in the ignore list
        if (ignoreFiles.includes(entry.name)) {
            continue;
        }

        const srcPath = path.join(source, entry.name);
        const tgtPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, tgtPath, options);
        } else {
            fs.copyFileSync(srcPath, tgtPath);
        }
    }
}
