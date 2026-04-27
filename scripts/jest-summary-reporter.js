const fs = require('fs');
const path = require('path');

class JestSummaryReporter {
    constructor(globalConfig, _reporterOptions) {
        this._rootDir = globalConfig.rootDir;
        // Nx/jest runs with cwd = workspace root, so test-evidence/ lives at the workspace root.
        this._outputDir = path.resolve(process.cwd(), 'test-evidence');
    }

    onRunComplete(_contexts, results) {
        const pkgJsonPath = path.join(this._rootDir, 'package.json');
        if (!fs.existsSync(pkgJsonPath)) return;

        let pkg;
        try {
            pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        } catch (_err) {
            return;
        }

        const name = pkg.name;
        if (!name) return;

        const entriesDir = path.join(this._outputDir, '.entries');
        fs.mkdirSync(entriesDir, { recursive: true });

        const {
            numTotalTests,
            numPassedTests,
            numFailedTests,
            numPendingTests,
            numTotalTestSuites,
            numPassedTestSuites,
            numFailedTestSuites,
            startTime,
        } = results;

        // NB: do NOT use `results.success` — jest sets it to false whenever coverage thresholds
        // aren't met even though every test passed. Auditors read this as a test failure. Derive
        // from failure counts so "Result" reflects what the word "testing" actually means here.
        const success = numFailedTests === 0 && numFailedTestSuites === 0;

        const durationMs = Math.max(0, Date.now() - (startTime || Date.now()));

        const suiteLine =
            `- Suites: ${numPassedTestSuites}/${numTotalTestSuites} passed` +
            (numFailedTestSuites ? ` (${numFailedTestSuites} failed)` : '');

        const testLine =
            `- Tests: ${numPassedTests}/${numTotalTests} passed` +
            (numFailedTests ? `, ${numFailedTests} failed` : '') +
            (numPendingTests ? `, ${numPendingTests} pending` : '');

        const md = [
            `# Test Summary — ${name}`,
            '',
            `- Package: \`${name}\` v${pkg.version || '0.0.0'}`,
            suiteLine,
            testLine,
            `- Duration: ${(durationMs / 1000).toFixed(2)}s`,
            `- Result: ${success ? 'SUCCESS' : 'FAILURE'}`,
            '',
        ].join('\n');

        const summaryPath = path.join(this._outputDir, `${name}-test-summary.md`);
        const entryPath = path.join(entriesDir, `${name}.json`);

        fs.writeFileSync(summaryPath, md);

        fs.writeFileSync(
            entryPath,
            JSON.stringify(
                {
                    packageName: name,
                    packageVersion: pkg.version,
                    filename: `${name}-test-summary.md`,
                    path: `test-evidence/${name}-test-summary.md`,
                    numTotalTests,
                    numPassedTests,
                    numFailedTests,
                    numPendingTests,
                    numTotalTestSuites,
                    numPassedTestSuites,
                    numFailedTestSuites,
                    durationMs,
                    success,
                },
                null,
                2,
            ),
        );

        // console.info goes to stdout under jest and surfaces in the GitLab job log.
        console.info(
            `[jest-summary-reporter] ${name}: suites ${numPassedTestSuites}/${numTotalTestSuites}, ` +
                `tests ${numPassedTests}/${numTotalTests} (${success ? 'SUCCESS' : 'FAILURE'}) ` +
                `→ ${path.relative(process.cwd(), summaryPath)}`,
        );
    }
}

module.exports = JestSummaryReporter;
