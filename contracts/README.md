# OpenAPI contracts

OpenAPI contracts live under `contracts/<contract-name>/<version>/openapi.yml`.

Each version directory keeps its entrypoint as `openapi.yml` next to any relative `$ref` folders such as `paths/`, `schemas/`, `parameters/`, and `examples/`. The docs generator discovers these entrypoints and writes generated API reference pages to `docs/api-reference/`.
