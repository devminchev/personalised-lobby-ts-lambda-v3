FROM dockerhub-proxy.artifactory.gamesys.co.uk/node:20-bookworm AS builder

WORKDIR /app

# Copy the entire workspace first
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Build command is parameterized and will be passed during docker build
ARG FUNCTION_NAME
RUN test -n "$FUNCTION_NAME" || (echo "FUNCTION_NAME build argument is required" && exit 1)

# Build the specific function using NX
RUN ./nx build $FUNCTION_NAME --configuration=production

# Intermediate stage to prepare files
FROM dockerhub-proxy.artifactory.gamesys.co.uk/node:20-bookworm AS prepare

# Copy the mapping file and dist directory from builder
COPY --from=builder /app/dist /tmp/dist
COPY --from=builder /app/functions/.mapping /tmp/functions/.mapping

# Set the function name argument
ARG FUNCTION_NAME

# For each function in the mapping, check if its right-hand value equals our FUNCTION_NAME
# If found, use the left-hand value as the directory name
RUN mkdir -p /tmp/app && \
    found=false && \
    mapped_value="" && \
    echo "Finding mapping for project name: $FUNCTION_NAME" && \
    while IFS='=' read -r dir_name project_name; do \
      echo "Checking $dir_name = $project_name against $FUNCTION_NAME"; \
      if [ "$project_name" = "$FUNCTION_NAME" ]; then \
        echo "Found match! Directory for $FUNCTION_NAME is $dir_name"; \
        mapped_value="$dir_name"; \
        found=true; \
        break; \
      fi; \
    done < /tmp/functions/.mapping && \
    if [ "$found" = "false" ]; then \
      echo "ERROR: Could not find function directory for project $FUNCTION_NAME" && \
      echo "Available mappings:" && cat /tmp/functions/.mapping && \
      exit 1; \
    fi && \
    if [ ! -d "/tmp/dist/functions/$mapped_value" ]; then \
      echo "ERROR: Build output directory for $mapped_value not found" && \
      echo "Contents of dist/functions:" && ls -la /tmp/dist/functions/ && \
      exit 1; \
    fi && \
    cp -r /tmp/dist/functions/$mapped_value/* /tmp/app/

# Final stage - use official AWS Lambda base image
# NEVER CHANGE THIS BASE IMAGE
FROM public.ecr.aws/lambda/nodejs:20

# Copy function code and dependencies to Lambda task root
COPY --from=prepare /tmp/app/ ${LAMBDA_TASK_ROOT}/

# Set handler command
CMD [ "app.lambdaHandler" ]
