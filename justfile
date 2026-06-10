# Documentation commands
# These commands set up a local docs preview using the shared shell package.
# The shell ships the openapi-fumadocs-generator bin; we run it from the
# preview's installed node_modules so the lambda repo doesn't need any
# additional package manager state.

# Shell repo remote
SHELL_REMOTE := "git@gitlab.ballys.tech:excite/native/tools/lobby-docs-shell.git"
# Local preview directory (gitignored)
PREVIEW := ".docs-preview"

# Clone shell repo and install preview app dependencies.
# Installing the preview runs @lobby/docs-shell's prepare script which builds
# the generator into dist/openapi-generator/cli.js and symlinks it as
# .docs-preview/preview/node_modules/.bin/openapi-fumadocs-generator.
docs-setup:
    rm -rf {{PREVIEW}}
    git clone --depth 1 {{SHELL_REMOTE}} {{PREVIEW}}
    cd {{PREVIEW}}/preview && pnpm install

# Generate API reference pages from local OpenAPI contracts.
docs-openapi: docs-setup
    {{PREVIEW}}/preview/node_modules/.bin/openapi-fumadocs-generator --root .

# Start the local docs development server.
docs-dev: docs-openapi
    cd {{PREVIEW}}/preview && pnpm dev

# Build the docs (for validation).
docs-build: docs-openapi
    cd {{PREVIEW}}/preview && pnpm build

# Clean the docs preview app.
docs-clean:
    rm -rf {{PREVIEW}}
