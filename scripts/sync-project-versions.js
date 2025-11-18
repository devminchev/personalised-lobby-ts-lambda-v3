#!/usr/bin/env node

/**
 * This script synchronizes the version from a project's package.json
 * to its project.json file. It should be run after all versioning operations
 * to ensure project.json always has the latest version from package.json.
 *
 * Usage: node sync-project-versions.js [projectName]
 * If projectName is provided, only that project will be processed.
 * If no projectName is provided, all projects will be processed with a single commit.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
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

// Find all project.json files in the workspace
function findProjectJsonFiles(targetProject = null) {
    const patterns = [
        path.join(workspaceRoot, 'functions/*/project.json'),
        path.join(workspaceRoot, 'libs/*/project.json'),
    ];

    let projectJsonFiles = [];
    patterns.forEach((pattern) => {
        const files = glob.sync(pattern);
        projectJsonFiles = projectJsonFiles.concat(files);
    });

    // If a specific project is requested, filter the list
    if (targetProject) {
        projectJsonFiles = projectJsonFiles.filter((filePath) => {
            try {
                const projectJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return projectJson.name === targetProject;
            } catch (error) {
                console.error(`Error reading project.json at ${filePath}:`, error);
                return false;
            }
        });
    }

    return projectJsonFiles;
}

// Update project.json files with versions from package.json
function syncProjectVersions(targetProject = null) {
    console.log(
        `Synchronizing ${targetProject ? `version for project ${targetProject}` : 'versions for all projects'} from package.json to project.json files...`,
    );
    console.log(`Workspace root: ${workspaceRoot}`);

    const projectJsonFiles = findProjectJsonFiles(targetProject);
    console.log(`Found ${projectJsonFiles.length} project.json files to process`);

    if (projectJsonFiles.length === 0 && targetProject) {
        console.error(`No project.json file found for project ${targetProject}`);
        process.exit(1);
    }

    const updatedProjects = [];
    const updatedFiles = [];

    projectJsonFiles.forEach((projectJsonPath) => {
        try {
            const projectDir = path.dirname(projectJsonPath);
            const packageJsonPath = path.join(projectDir, 'package.json');

            // Skip if package.json doesn't exist
            if (!fs.existsSync(packageJsonPath)) {
                console.log(`Skipping ${projectDir} - no package.json found`);
                return;
            }

            // Read files
            const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            // Skip if either file doesn't have a version
            if (!packageJson.version) {
                console.log(`Skipping ${projectDir} - no version in package.json`);
                return;
            }

            const projectName = projectJson.name;
            const oldVersion = projectJson.version || '0.0.0';
            const newVersion = packageJson.version;

            // Update version in project.json if different
            if (oldVersion !== newVersion) {
                projectJson.version = newVersion;
                fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2) + '\n');
                console.log(`Updated ${projectName} version in project.json from ${oldVersion} to ${newVersion}`);
                updatedProjects.push(projectName);
                updatedFiles.push(projectJsonPath);
            } else {
                console.log(`No version change needed for ${projectName} (${oldVersion})`);
            }
        } catch (error) {
            console.error(`Error processing ${projectJsonPath}:`, error);
        }
    });

    if (updatedProjects.length > 0) {
        console.log(`Updated project.json versions for: ${updatedProjects.join(', ')}`);

        try {
            // Stage the updated files
            console.log('Staging updated project.json files...');
            updatedFiles.forEach((filePath) => {
                execSync(`git add "${filePath}"`, { cwd: workspaceRoot, stdio: 'inherit' });
            });

            // Commit the changes with a single commit
            const commitMessage =
                updatedProjects.length === 1
                    ? `chore: sync project.json version for ${updatedProjects[0]} [skip ci]`
                    : `chore: sync project.json versions for ${updatedProjects.length} projects [skip ci]`;

            console.log(`Committing changes with message: ${commitMessage}`);
            execSync(`git commit -m "${commitMessage}" --no-verify`, {
                cwd: workspaceRoot,
                stdio: 'inherit',
            });

            // Push the commit to the remote repository
            console.log('Pushing changes to remote repository...');
            execSync(`git push origin HEAD:${process.env.CI_COMMIT_BRANCH || 'main'} -o ci.skip`, {
                cwd: workspaceRoot,
                stdio: 'inherit',
            });

            console.log('All project.json files committed successfully in a single commit.');
        } catch (error) {
            console.error('Error committing project.json changes:', error);
            console.error('You may need to manually commit the changes.');
        }
    } else {
        console.log('No project versions were updated.');
    }

    return updatedProjects;
}

// Run the script
const targetProject = process.argv[2];
syncProjectVersions(targetProject);
