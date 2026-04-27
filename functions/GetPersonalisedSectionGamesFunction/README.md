# Get-personalised-games Lambda Function (Personalised Section Games)

> Get personalised section games for a member

The lambda retrieves personalised games (ML-recommended) for a specific member and section on a venture for the endpoint `/sites/{sitename}/platform/{platform}/view/{viewslug}/sections/{sectionid}/sitegames/personalised?memberid={memberid}`

Only ML-personalised section types are supported (suggested, because-you-played, recently-played). Non-personalised section types return a 400 error.

## UML Activity Diagram

```mermaid
graph TD
  A[Start] --> B[Extract params including memberid and compute locales]
  B --> C[Validate inputs and patch sitename]
  C --> D{Params valid?}
  D -->|No| E[Return 400 MissingParams]
  D -->|Yes| F[Query sections index to get ids and type]
  F --> G{Section found?}
  G -->|No| H[Return 404 MissingSection]
  G -->|Yes| I{ML personalised section?}
  I -->|No| J[Return 400 InvalidRequest]
  I -->|Yes| L[handlePersonalizedGames]

  L --> L1{Section type}
  L1 --> LS[Suggested]
  L1 --> LB[Because you played]
  L1 --> LR[Recently played]

  subgraph Suggested
    direction TB
    LS --> S1[getMlSuggestedGamesGames returns ids]
    S1 --> S2{Any ids?}
    S2 -->|No| SF[Fallback to default list]
    S2 -->|Yes| S3[getMLRecommendedGamesFromGamesIndex]
    S3 --> S4{Any games?}
    S4 -->|No| SF
    S4 -->|Yes| S5[Build payload and order by id]
    S5 --> S6[Return 200 payload]
  end

  subgraph Because
    direction TB
    LB --> B1[getMlContentBasedGames returns skins]
    B1 --> B2{Any skins?}
    B2 -->|No| BE[Return 200 empty list]
    B2 -->|Yes| B3[getMLRecommendedGamesFromGamesIndexBySkin]
    B3 --> B4{At least four games?}
    B4 -->|No| BE
    B4 -->|Yes| B5[Build payload order and slice]
    B5 --> B6[Return 200 payload]
  end

  subgraph Recently
    direction TB
    LR --> R0[Map Contentful sort to orderCriteria]
    R0 --> R1[getRecentlyPlayedSkins]
    R1 --> R2{Enough games?}
    R2 -->|No| RE[Return 200 empty list]
    R2 -->|Yes| R3[getMLRecommendedGamesFromGamesIndexBySkin]
    R3 --> R4[Filter exclude_recently_played tag]
    R4 --> R5[Build payload, reorder & slice]
    R5 --> R6[Return 200 payload]
  end
```

## Sequence diagram

```mermaid
sequenceDiagram
    participant API as API Gateway
    participant L as GetPersonalisedSectionGamesFunction
    participant OSC as OS Client
    participant OS as OpenSearch

    API->>L: Invoke lambdaHandler(event)
    L->>L: Extract/validate params (including memberid)
    L->>OSC: getClient()
    L->>OS: Search ALL_SECTIONS_SHARED_READ_ALIAS
    OS-->>L: Section hits (games|game, type)
    L->>L: isMlPersonalizedSection check
    alt not ML personalised
        L-->>API: 400 InvalidRequest
    else ML personalised
        alt Suggested
            L->>OS: ML_GAMES_RECOMMENDER_INDEX_ALIAS (member+site)
            OS-->>L: ML game ids (ranked)
            L->>OS: IG_GAMES_V2_READ_ALIAS (ids + child sitegame)
            OS-->>L: Game hits + inner_hits.sitegame
            L->>L: gamesPayloadBySiteGame + orderedPayload
        else Recently-played
            L->>L: Map sort via ORDER_CRITERIA_TO_FIELD
            L->>OS: ML_RECENTLY_PLAYED_ALIAS (member+site)
            OS-->>L: recently_played_games[]
            L->>L: top30Desc + min threshold
            L->>OS: IG_GAMES_V2_READ_ALIAS (skins + child sitegame)
            OS-->>L: Game hits + inner_hits.sitegame
            L->>L: Filter exclude_recently_played metadata
            L->>L: gamesPayloadByGame + orderByKey + slice(12)
        else Because-you-played (x/y/z)
            L->>OS: ML because-you-played-* (member+site)
            OS-->>L: ML game skins (ranked)
            L->>OS: IG_GAMES_V2_READ_ALIAS (terms on gameSkin + child sitegame)
            OS-->>L: Game hits + inner_hits.sitegame
            L->>L: gamesPayloadByGame + orderByKey + slice(50)
        end
    end
    L-->>API: 200 payload (or 4xx/5xx on error)
```

Notes

- `getClient()` builds the OpenSearch client from environment variables but does not validate them; any misconfiguration surfaces later as the "os client error" branch when a query executes.
- `getLambdaExecutionEnvironment()` validates `EXECUTION_ENVIRONMENT` and defaults to `production` if missing/invalid.
- This lambda only handles ML-personalised section types. Non-personalised sections return 400 (InvalidRequest) via `isMlPersonalizedSection` check.
- Missing section in `ALL_SECTIONS_SHARED_READ_ALIAS` yields 404 (MissingSection).
- When ML returns no recommendations, `handleMissingMLRecommendations` falls back to the section's default game list from Contentful.
- The **recently played** branch honours Contentful sort choices by mapping the `sort`
  field from `igSimilarityBasedPersonalisedSection` to OpenSearch metrics via
  `ORDER_CRITERIA_TO_FIELD` (margin → `margin_rank`, `rtp`, `wager`, `rounds`). After enrichment it
  filters the `exclude_recently_played` metadata tag before ordering.

## Error handling and status codes

This function standardises error responses. When an error is thrown inside the handler, the catch block returns:

```json
{ "code": "<ErrorCode>", "message": "<Human readable message>" }
```

### Non-200 responses

| Scenario                                                                              | Where                                          | Status | Error code              | Body                                                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------- | -----: | ----------------------- | ------------------------------------------------------------------- |
| Missing required params (`sitename`, `platform`, `viewslug`, `sectionid`, `memberid`) | `checkRequestParams`                           |    400 | `MissingParams`         | `{ code: MissingParams, message: <msg> }`                           |
| Section type is not ML personalised                                                   | `isMlPersonalizedSection` check in handler     |    400 | `InvalidRequest`        | `{ code: InvalidRequest, message: <msg> }`                          |
| Invalid pagination params (negative, non-integer)                                     | `parsePaginationParam`                         |    400 | `InvalidRequest`        | `{ code: InvalidRequest, message: <msg> }`                          |
| Section not found for id/platform/env                                                 | `getGamesListForSection` (sections read alias) |    404 | `MissingSection`        | `{ code: MissingSection, message: <msg> }`                          |
| No `inner_hits.game` returned for a siteGame hit                                      | `validateGameHits` via `getGameHits`           |    404 | `NoGamesReturned`       | `{ code: NoGamesReturned, message: <msg> }`                         |
| OpenSearch client error (network/5xx/parse)                                           | `osClient.searchWithHandling`                  |    500 | `OpenSearchClientError` | `{ code: OpenSearchClientError, message: "Internal Server Error" }` |

Notes

- The handler catch block uses `err.statusCode || 500` so any thrown error with a status propagates; otherwise it defaults to 500.
- Error codes and messages come from the shared `os-client` error helpers.

### 200 with empty payload (in this lambda)

The personalised handler returns HTTP 200 with an empty array (no error) when no games are available.

| Scenario                                    | Where                              | Behaviour                                                                   |
| ------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| ML returns no recs or rec games not found   | ML helpers / personalised handlers | Returns `[]` from the personalised handler; Lambda responds `200` with `[]` |
| Fallback: default game list returns no hits | `getGamesSiteGames`                | Logs a warn and returns `[]`; Lambda responds `200` with `[]`               |

## Local development

The monorepo uses Nx for builds and SAM for local invocation.

### Prerequisites

- Node.js 20, Yarn
- AWS CLI + SAM CLI
- Container runtime: Podman (preferred locally) or Docker

### One-time setup

```bash
# from repo root
yarn install

# copy environment files used by SAM (two territories supported out-of-the-box)
cp env.eu.json.example env.eu.json
cp env.na.json.example env.na.json

# optional: for container-run helper script (reads env.json)
cp env.eu.json.example env.json
```

### Build with Nx (used by SAM under the hood)

You can build just this function or the whole workspace:

```bash
# build only this function
npx nx build get-personalised-section-games

# or build everything
yarn build
```

SAM’s template uses `BuildMethod: makefile` which calls `scripts/sam-nx-build.js` to place outputs in `.aws-sam/build/<FunctionName>`.

### Build the SAM project

```bash
# build all resources declared in template.yaml
sam build

# or build specific resource(s)
sam build --parameter-overrides "FunctionName=GetPersonalisedSectionGamesFunction"
```

### Invoke locally with SAM

EU (default config-env):

```bash
sam local invoke "GetPersonalisedSectionGamesFunction" -e functions/GetPersonalisedSectionGamesFunction/events/event.eu.json --env-vars env.eu.json
```

NA (uses `samconfig.toml` env overrides):

```bash
sam local invoke "GetPersonalisedSectionGamesFunction" \
  -e functions/GetPersonalisedSectionGamesFunction/events/event.na.json \
  --config-env na
```

Tip: Nx wrappers exist for convenience (ensure `sam build` ran first):

```bash
# EU
npx nx run get-personalised-section-games:sam-invoke-eu

# NA (override function name just in case)
npx nx run get-personalised-section-games:sam-invoke-na --args="--functionName=GetPersonalisedSectionGamesFunction"
```

### Run a local API with SAM

```bash
sam local start-api                 # default (EU)
# or
sam --config-env na local start-api # NA

# then call
curl "http://127.0.0.1:3000/sites/{sitename}/platform/{platform}/view/{viewslug}/sections/{sectionid}/sitegames/personalised?memberid={memberid}"

# pagination example (offset + limit)
curl "http://127.0.0.1:3000/sites/{sitename}/platform/{platform}/view/{viewslug}/sections/{sectionid}/sitegames/personalised?memberid={memberid}?offset=0&limit=10"
```

### Containerised local run (Podman/Docker)

Build an image for this function and run it in a local container:

```bash
# build image (Podman locally)
npx nx run get-personalised-section-games:docker

# run and invoke via helper (reads ./env.json)
npx nx run get-personalised-section-games:run-docker
```

The helper script `scripts/invoke-docker-lambda.js` will:

- start the container `personalised-lobby/get-personalised-section-games:latest`
- POST the example event file `functions/GetPersonalisedSectionGamesFunction/events/event.json` to the runtime
- stop and remove the container

To target NA values with the helper, replace `env.json` with NA values (or generate it from `env.na.json.example`).

### Tests, lint, and formatting

```bash
# tests (integration tests use nock)
npx nx test get-personalised-section-games

# lint just this project
npx nx lint get-personalised-section-games

# format files in this project
npx nx run get-personalised-section-games:format
```

## Future work

### Pagination

#### Implemented endpoint pagination

This lambda supports request-level pagination through query params:

- `offset` (optional): zero-based starting index in the section `games` list.
- `limit` (optional): max number of games to return after `offset` is applied.

Rules:

- both params are optional.
- values must be non-negative integers.
- invalid values (e.g. `-1`, `1.5`, `abc`) return `400 InvalidRequest`.

Examples:

```bash
# first 10 games
curl "http://127.0.0.1:3000/sites/{sitename}/platform/{platform}/view/{viewslug}/sections/{sectionid}/sitegames/personalised?memberid={memberid}?offset=0&limit=10"

# next 10 games
curl "http://127.0.0.1:3000/sites/{sitename}/platform/{platform}/view/{viewslug}/sections/{sectionid}/sitegames?offset=10&limit=10"
```

#### Basic Pagination Concept

`size`: This parameter controls how many results to return in your response.
`from`: This parameter specifies the offset from the first result you want to retrieve. This allows you to "skip" over a set number of results.

##### How to Implement Pagination

For the initial request, you might not use the from parameter, or set it to 0, and just set size to the number of results you want per page. For subsequent requests, you increment the from parameter by the size of the previous pages.

Here's how you can calculate the from parameter for pagination:

###### First Page Request

```json
{
    "from": 0,
    "size": 10,
    "query": {
        "match_all": {}
    }
}
```

###### Second Page Request

```json
{
    "from": 10, // This is size of the first page
    "size": 10,
    "query": {
        "match_all": {}
    }
}
```

###### Third Page Request

```json
{
    "from": 20, // This is size of the first page + size of the second page
    "size": 10,
    "query": {
        "match_all": {}
    }
}
```

##### Considerations

Performance: As you paginate deeper into the dataset (i.e., a very high from value), performance might degrade because OpenSearch has to count through more data to get to the offset. For very large datasets or deep pagination, consider using the "Search After" feature which is more efficient for deep pagination.

##### Search After

This method is recommended for deep pagination. It uses the last result of the previous query as a point to start the next query. This is more efficient than using from and size for large datasets.

Here’s an example using search_after:

###### Initial Request

```json
{
    "size": 10,
    "query": {
        "match_all": {}
    },
    "sort": [
        { "_id": "asc" } // Ensure results are sorted by a field that includes a tie-breaking field
    ]
}
```

###### Subsequent Request (using the last \_id from the previous batch)

```json
{
    "size": 10,
    "query": {
        "match_all": {}
    },
    "search_after": ["last_id_from_previous_batch"],
    "sort": [{ "_id": "asc" }]
}
```

###### Steps to Calculate last_id_from_previous_batch

The last_id_from_previous_batch in the context of the "search after" method in OpenSearch refers to the last sort value of the results from your previous query. This value is used as the cursor for the next set of results.

1. Perform the Initial Search: Your first search request should include a sort parameter that defines how the results are sorted. It's crucial to sort by a field that ensures a unique sequence, like a timestamp or an ID. Often, a combination of fields is used to guarantee uniqueness.

Example query:

```json
{
    "size": 10,
    "query": {
        "match_all": {}
    },
    "sort": [
        { "timestamp": "asc" },
        { "_id": "asc" } // Using _id as a secondary sort to ensure uniqueness
    ]
}
```

1. Extract the Last Sort Value: When you receive your search results, you need to look at the sort values of the last document in the result set. This is typically returned in the search hits under the \_source or directly in the sort values.

2. Use This Value in the Next Search: For your subsequent query, use these sort values in the search_after parameter to start the next query right after the last document of your previous batch.

Example for the next query:

```json
{
    "size": 10,
    "query": {
        "match_all": {}
    },
    "search_after": ["2023-06-24T15:00:00", "xy123"], // Timestamp and _id of the last document from the previous query
    "sort": [{ "timestamp": "asc" }, { "_id": "asc" }]
}
```
