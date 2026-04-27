# Documentation commands
# These commands set up a local docs preview using the shared shell package

# Shell repo remote
SHELL_REMOTE := "git@gitlab.ballys.tech:excite/native/tools/lobby-docs-shell.git"
# Local preview directory (gitignored)
PREVIEW := ".docs-preview"

# Clone shell repo and install preview app dependencies
docs-setup:
    rm -rf {{PREVIEW}}
    git clone --depth 1 {{SHELL_REMOTE}} {{PREVIEW}}
    cd {{PREVIEW}}/preview && pnpm install

# Start the local docs development server
docs-dev: docs-setup
    cd {{PREVIEW}}/preview && pnpm dev

# Build the docs (for validation)
docs-build: docs-setup
    cd {{PREVIEW}}/preview && pnpm build

# Clean the docs preview app
docs-clean:
    rm -rf {{PREVIEW}}
