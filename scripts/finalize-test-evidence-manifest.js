#!/usr/bin/env node

/**
 * Merges per-project jest-summary-reporter slices into a single
 * test-evidence/manifest.json, injecting CI job URL, pipeline URL, commit SHA,
 * and generated-at timestamp from the environment. Always writes the manifest,
 * even if no per-project entries exist, so downstream jobs can rely on the file.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(process.cwd(), 'test-evidence');
const ENTRIES_DIR = path.join(OUTPUT_DIR, '.entries');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

function envOrNull(name) {
    const value = process.env[name];
    return value && value.trim() !== '' ? value : null;
}

function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const jobUrl = envOrNull('CI_JOB_URL');
    const pipelineUrl = envOrNull('CI_PIPELINE_URL');
    const commitSha = envOrNull('CI_COMMIT_SHA');
    const jobName = envOrNull('CI_JOB_NAME');
    const generatedAt = new Date().toISOString();

    const manifest = {};

    if (fs.existsSync(ENTRIES_DIR)) {
        for (const filename of fs.readdirSync(ENTRIES_DIR)) {
            if (!filename.endsWith('.json')) continue;
            const slicePath = path.join(ENTRIES_DIR, filename);
            let entry;
            try {
                entry = JSON.parse(fs.readFileSync(slicePath, 'utf8'));
            } catch (err) {
                console.warn(`Skipping malformed slice ${slicePath}: ${err.message}`);
                continue;
            }
            if (!entry.packageName) continue;

            manifest[entry.packageName] = {
                ...entry,
                jobUrl,
                pipelineUrl,
                commitSha,
                jobName,
                generatedAt,
            };
        }
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    const count = Object.keys(manifest).length;
    console.log(
        `Wrote test-evidence/manifest.json with ${count} entr${count === 1 ? 'y' : 'ies'} ` +
            `(jobUrl=${jobUrl ? 'set' : 'null'}, pipelineUrl=${pipelineUrl ? 'set' : 'null'}).`,
    );
}

main();
