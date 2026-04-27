#!/usr/bin/env zx

/**
 * Bulk version dashboard updater for personalised-lobby lambda functions.
 * Reads versions.json (object keyed by package name), resolves relComponent
 * from functions/<folder>/package.json, and calls lbe-version-tracker update.
 *
 * Usage: npx zx scripts/version_dashboard_update.mjs --environment=aws-stg-eu00
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

$.verbose = true;

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
process.chdir(REPO_ROOT);

const readJson = async (filePath) => {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (err) {
    console.error(`Error: Failed to read ${filePath}: ${err.message}`);
    process.exit(1);
  }
};

const environmentArg = process.argv.find((arg) => arg.startsWith("--environment="));
const environment = environmentArg?.split("=")[1] ?? "";

if (!environment) {
  console.error("Error: --environment parameter is required");
  console.error("");
  console.error("Usage: npx zx scripts/version_dashboard_update.mjs --environment=<env>");
  console.error("Example: npx zx scripts/version_dashboard_update.mjs --environment=aws-stg-eu00");
  console.error("");
  console.error("Valid environments:");
  console.error("  - aws-stg-eu00");
  console.error("  - aws-prod-eu00");
  console.error("  - aws-stg-eu03");
  console.error("  - aws-prod-eu03");
  process.exit(1);
}

if (!(await which("lbe-version-tracker", { nothrow: true }))) {
  console.error("Error: lbe-version-tracker CLI not found on PATH");
  process.exit(1);
}

const versionsPath = resolve("versions.json");
if (!existsSync(versionsPath)) {
  console.error("Error: versions.json not found");
  process.exit(1);
}

const versionsData = await readJson(versionsPath);

if (!versionsData || typeof versionsData !== "object" || Array.isArray(versionsData)) {
  console.error("Error: versions.json must contain a JSON object keyed by package name");
  process.exit(1);
}

const entries = Object.entries(versionsData);
if (entries.length === 0) {
  console.log("No entries in versions.json — nothing to update.");
  process.exit(0);
}

let total = 0;
let success = 0;
let failed = 0;
let successfulEntries = "";
let failedEntries = "";

for (const [name, entry] of entries) {
  total += 1;

  if (!entry || typeof entry !== "object") {
    console.error(`Error: Invalid entry for ${name}`);
    failed += 1;
    failedEntries += `  x ${name}: invalid entry format\n`;
    continue;
  }

  const { version, folder } = entry;

  if (!version || !folder) {
    console.error(`Error: Invalid entry for ${name} (missing version or folder)`);
    failed += 1;
    failedEntries += `  x ${name}: missing version or folder\n`;
    continue;
  }

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`Error: Invalid version format "${version}" for ${name} (expected x.y.z)`);
    failed += 1;
    failedEntries += `  x ${name}: invalid version format\n`;
    continue;
  }

  const packageJsonPath = join("functions", folder, "package.json");
  if (!existsSync(packageJsonPath)) {
    console.error(`Error: package.json not found for ${name} at ${packageJsonPath}`);
    failed += 1;
    failedEntries += `  x ${name}: package.json not found in ${folder}\n`;
    continue;
  }

  const packageData = await readJson(packageJsonPath);
  const relComponent = packageData.relComponent;

  if (!relComponent) {
    console.error(`Error: Missing relComponent in ${packageJsonPath}`);
    console.error('  Add "relComponent": "your_component_name" to package.json.');
    console.error('  Note: relComponent is required for version dashboard tracking even if function has "skipRelTicket": true');
    failed += 1;
    failedEntries += `  x ${name}: missing relComponent in package.json\n`;
    continue;
  }

  if (packageData.skipRelTicket === true) {
    console.log(`Warning: ${folder} has both relComponent and skipRelTicket=true. Using relComponent.`);
  }

  console.log("");
  console.log(`--- Processing: ${name} ---`);
  console.log(`  Deploy key: ${relComponent}`);
  console.log(`  Version: ${version}`);
  console.log(`  Environment: ${environment}`);

  const result = await $`lbe-version-tracker update ${environment} ${relComponent} ${version} --name ${name}`.nothrow();
  if (result.exitCode === 0) {
    success += 1;
    successfulEntries += `  + ${name} (${relComponent} -> ${version})\n`;
  } else {
    failed += 1;
    failedEntries += `  x ${name} (${relComponent} -> ${version})\n`;
  }
}

console.log("");
console.log("=== Update Summary ===");
console.log("");
console.log(`Total: ${total}`);
console.log(`Successful: ${success}`);
console.log(`Failed: ${failed}`);

if (success > 0) {
  console.log("");
  console.log("Successful updates:");
  process.stdout.write(successfulEntries);
}

if (failed > 0) {
  console.log("");
  console.log("Failed updates:");
  process.stdout.write(failedEntries);
  process.exit(1);
}
