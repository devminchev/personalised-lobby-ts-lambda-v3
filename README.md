# Personalised Lobby

The project contains a collection of lambdas and layers in order to provide functionality needed by the frontend for lobby personalization.

## Project Structure

- events - Invocation events that you can use to invoke the function.
- template.yaml - A template that defines the application's AWS resources.

The application uses several AWS resources, including Lambda functions and an API Gateway API. These resources are defined in the `template.yaml` file in this project. You can update the template to add AWS resources through the same deployment process that updates your application code.

### lambdas

A collection of lambda functions implementing API endpoints, each organised as a separate package under [./functions/](./functions/) with its own `package.json`, `app.ts`, `tests/`, `events/`, and (in most cases) a `README.md` covering the contract and local invocation.

The deployed lambdas, grouped by API gateway, are:

#### GET endpoints (`LobbyApi`)

| Function                                                                                         | Path                                                                                                |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| [GetNavigationFunction](./functions/GetNavigationFunction/README.md)                             | `/sites/{sitename}/platform/{platform}/navigation`                                                  |
| [GetViewFunction](./functions/GetViewFunction/README.md)                                         | `/sites/{sitename}/platform/{platform}/view/{viewslug}`                                             |
| [GetSectionViewFunction](./functions/GetSectionViewFunction/README.md)                           | `/sites/{sitename}/platform/{platform}/section/{sectionslug}`                                       |
| [GetGamesFunction](./functions/GetGamesFunction/README.md)                                       | `/sites/{sitename}/platform/{platform}/view/{viewslug}/sections/{sectionid}/sitegames`              |
| [GetPersonalisedSectionGamesFunction](./functions/GetPersonalisedSectionGamesFunction/README.md) | `/sites/{sitename}/platform/{platform}/view/{viewslug}/sections/{sectionid}/sitegames/personalised` |
| [GetGameConfigFunction](./functions/GetGameConfigFunction/README.md)                             | `/sites/{sitename}/platform/{platform}/game-config/{gamename}`                                      |
| [GetGameInfoFunction](./functions/GetGameInfoFunction/README.md)                                 | `/sites/{sitename}/platform/{platform}/games/{gamename}`                                            |
| [GetGameSkinConfigFunction](./functions/GetGameSkinConfigFunction/README.md)                     | `/sites/{sitename}/game-skin-config/{gameskin}`                                                     |
| [GetGameShuffleFunction](./functions/GetGameShuffleFunction/README.md)                           | `/sites/{sitename}/platform/{platform}/game-shuffle`                                                |
| [GetVariantFunction](./functions/GetVariantFunction/README.md)                                   | `/sites/{sitename}/memberid/{memberid}/variant`                                                     |
| [GetMiniGamesFunction](./functions/GetMiniGamesFunction/README.md)                               | `/sites/{sitename}/platform/{platform}/minigames`                                                   |
| [GetAllGamesSearchFunction](./functions/GetAllGamesSearchFunction/README.md)                     | `/sites/{sitename}/platform/{platform}/search`                                                      |
| [GetSuggestedForYouFunction](./functions/GetSuggestedForYouFunction/README.md)                   | `/sites/{sitename}/platform/{platform}/suggested-for-you`                                           |
| [GetRecentlyPlayedFunction](./functions/GetRecentlyPlayedFunction/README.md)                     | `/sites/{sitename}/platform/{platform}/recently-played`                                             |
| [GetPersonalisedExtraDataFunction](./functions/GetPersonalisedExtraDataFunction/README.md)       | `/sites/{sitename}/personalised-extra-data`                                                         |
| [GetRecommendedGamesOnExitFunction](./functions/GetRecommendedGamesOnExitFunction/README.md)     | `/sites/{sitename}/platform/{platform}/gameskin/{gameskin}/recommended-games-on-exit`               |
| [GetBulkGameDataFunction](./functions/GetBulkGameDataFunction/README.md)                         | `/sites/{sitename}/platform/{platform}/get-bulk-game-data`                                          |
| [GetHistoricalGameTitlesFunction](./functions/GetHistoricalGameTitlesFunction/README.md)         | `/sites/{sitename}/game-historical-titles`                                                          |

#### POST endpoints (`LobbyPostApi`, deployed as `backoffice-v2`)

| Function                                                                                                 | Path                              |
| -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [PostGamesPayloadFunction](./functions/PostGamesPayloadFunction/README.md)                               | `/sync-games-payload`             |
| [PostHistoricalGameTitlesHandlerFunction](./functions/PostHistoricalGameTitlesHandlerFunction/README.md) | `/historical-game-titles-handler` |

The folders [GetAllGamesSearchFunctionV2](./functions/GetAllGamesSearchFunctionV2/), [GetBecauseYouPlayedFunction](./functions/GetBecauseYouPlayedFunction/), [GetCachingTestFunction](./functions/GetCachingTestFunction/), and [GetGameTitlesFunction](./functions/GetGameTitlesFunction/) exist in the repo but are not currently wired into [template.yaml](./template.yaml).

### Shared library

[OSClient](./libs/OSClient/) (published internally as the `os-client` package) is a shared library that holds code reused across the lambdas — the OpenSearch client, helpers, types, and contract validation. Each lambda imports it as a normal dependency rather than via a Lambda Layer.

#### Local development

Each lambda function has its own configuration and package.json. Use yarn to install any dependencies needed.

#### Tests

Tests are defined inside each lambda function under the `tests` folder. Use Yarn to install the [Jest test framework](https://jestjs.io/) and run unit tests.

### Building Lambda functions

The build configuration of the lambda functions as well as their architecture and any env variables or properties they need can be found in the `template/yaml` file.

```yaml
Resources:
    GetNavigationFunction:
        Type: AWS::Serverless::Function
        Properties:
            CodeUri: ./lambdas/{your-lambda-folder}/ # for example ./lambdas/get-navigation/
            Handler: app.lambdaHandler # How your handler function is called
            Runtime: nodejs20.x
            Layers: # if there are any layers that the lambda uses they are referenced here
                # - !ImportValue OSClientLayerArn
                - !Ref OSClientLayer
            Environment: # Any environment variables that the lambda would need.
            Architectures:
                - !Ref LambdaArchitecture
            Events:
                GetCategories: # This describes your API endpoint and refers to the API definition further down in the template.yaml file.
                    Type: Api
                    Properties:
                        Path: /path/{params}
                        Method: get
                        RestApiId:
                            Ref: GetCategoriesApi
        Metadata: # This is used to tell sam how your project should be build, what is the entrypoint as well as if any dependencies should be omitted when building (under External: property)
            BuildMethod: esbuild
            BuildProperties:
                Minify: true
                Target: es2020
                EntryPoints:
                    - app.ts
                External:
                    - os-client
                    - /opt/nodejs/node_modules/os-client
```

## Prerequisites

### Install

- AWS CLI
- SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Node.js - [Install Node.js 20](https://nodejs.org/en/), including the NPM package management tool.
- Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

### AWS CLI

1. Install an AWS CLI
2. Go to AWS via Okta
3. On the AWS landing page select `Access keys`
4. Follow the section to setup AWS via SSO (use the provided variables)
    1. SSO session name (Recommended): Lobby Playground
    2. SSO start URL [None]: `take from AWS page with creds`
    3. SSO region [None]: `take from AWS page with creds`
    4. SSO registration scopes [sso:account:access]: `press enter to select the default`
5. Confirm code in browser
6. When system prompts you for the option to select the account (in CLI) select `UnicornPegacorn - Dev - WW00`
7. CLI default client Region [eu-west-1]: `press enter to select the default`
8. CLI default output format [None]: `press enter to select the default`
9. CLI profile name [AdministratorAccess-146085466398]: lobby-playground

## Local development with SAM CLI

To build the whole project with sam, just run `sam build` from the top level.

Build your application with the `sam build` command.

```bash
sam build
```

If you want to build a specific lambda function and layer you can specify the resources via parameter overrides — see [Deploying when there are multiple lambda functions](#deploying-when-there-are-multiple-lambda-functions).

```sh
sam build --parameter-overrides "FunctionName=GetNavigationFunction LayerName=OSClientLayer LambdaArchitecture=x86_64" # Change the LambdaArchitecture=arm64 if you are building on M1
```

The SAM CLI installs dependencies defined in `functions/GetNavigationFunction/package.json`, compiles TypeScript with esbuild, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder for each lambda function in the project.

Since our lambdas use layers as well, sam builds those using a Makefile.

To run the functions locally and invoke them use the `sam local invoke` command specifying which function you want to run as well as the events.json and env.json credentials file. For example running locally the getCategories lambda function:

```bash
sam local invoke "GetNavigationFunction" -e functions/GetNavigationFunction/events/event.json --env-vars env.json
```

### Local API

The SAM CLI can also emulate your application's API. Use the `sam local start-api` to run the API locally on port 3000.

```bash
sam local start-api
curl http://localhost:3000/
```

The SAM CLI reads the application template to determine the API's routes and the functions that they invoke. The `Events` property on each function's definition includes the route and method for each path.

Example:

```yaml
Events:
    HelloWorld:
        Type: Api
        Properties:
            Path: /hello
            Method: get
```

## Docker

The project now includes Docker support for building and running lambda functions in containers. This provides consistent environments for development, testing, and production deployment.

### Building Docker Images

You can build Docker images for all lambda functions or specific ones using NX:

```bash
# Build Docker images for all functions locally
yarn docker:build

# Build Docker images for affected functions only
yarn docker:build:affected

# Build Docker images for production (with registry URL)
yarn docker:build:production

# Push Docker images to registry
yarn docker:push
```

### Docker Image Structure

The Docker images use a multi-stage build approach:

1. **Builder Stage**: Uses Node.js to build the lambda function using NX
2. **Runtime Stage**: Uses RHEL9 Node.js 20 as the base image for running the function

### Versioning and Tagging

Docker images are automatically tagged with the semantic version of each lambda function. The versioning process works as follows:

1. The CI pipeline runs semantic versioning using the @jscutlery/semver plugin
2. Each lambda function gets its own semantic version in its package.json
3. The Docker build job extracts these versions and uses them as image tags
4. If no semantic version is found, the commit SHA is used as fallback

### CI/CD Integration

The GitLab CI pipeline includes a Docker build stage that runs after the semantic versioning stage. It builds and publishes Docker images for all lambda functions with their respective semantic versions. The images are pushed to the Gamesys Artifactory registry (gamesys-native-docker-build.artifactory.gamesys.co.uk).

#### Local docker build

`yarn nx docker <function-name>`

#### Local docker image test

`yarn nx run-docker <function-name>`

## Deployment

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To build and deploy for the first time, run the following in your shell:

```bash
sam build
sam deploy --guided
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts:

- **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
- **AWS Region**: The AWS region you want to deploy your app to.
- **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
- **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
- **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

You can find your API Gateway Endpoint URL in the output values displayed after deployment.

On every subsequent build, if you chose to save the arguments to `samconfig.toml`, sam will take all the necessary parameters from there, so you can run `sam deploy` instead, without the `--guided` flag.

### Architecture

When doing `sam build` or `sam deploy` add the architecture flag override if you want `x86`, default one is `arm64`:

```sh
--parameter-overrides LambdaArchitecture=x86_64
```

### Deploying when there are multiple lambda functions

If trying to build and deploy only specific function or layer you can point to the resources directly when doing the build.
Keep in mind the `FunctionName` and `LayerName` have to correspond to their names in the `template.yaml` file.

```sh
sam build --parameter-overrides "FunctionName=GetNavigationFunction LayerName=OSClientLayer LambdaArchitecture=x86_64" # Change the LambdaArchitecture=arm64 if you are building for M1
```

```sh
sam deploy --template-file .aws-sam/build/template.yaml --parameter-overrides "FunctionName=GetNavigationFunction LayerName=OSClientLayer"
```

### Cleanup

To delete the sample application that you created, use the AWS CLI.

If you wish to delete the whole stack and already have a `samconfig.toml` file created simply run sam delete from top level. This will delete all the infrastructure created on AWS together with your lambda.

```bash
sam delete
```

If you don't have `samconfig.toml` file or if doesn't have your stack name run:

```bash
sam delete --stack-name personalised-lobby
```

### Fetch, tail, and filter Lambda function logs

To simplify troubleshooting, SAM CLI has a command called `sam logs`. `sam logs` lets you fetch logs generated by your deployed Lambda function from the command line. In addition to printing the logs on the terminal, this command has several nifty features to help you quickly find the bug.

`NOTE`: This command works for all AWS Lambda functions; not just the ones you deploy using SAM.

```bash
sam logs -n GetNavigationFunction --stack-name personalised-lobby --tail
```

You can find more information and examples about filtering Lambda function logs in the [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-logging.html).

## CI/CD

### Triggering the pipeline

In the sidebar go to Pipelines → Run Pipeline.

Here is an example of what the values look like. Apply logic and use the values you need for your run.

```text
# Pipeline triggers

Variable: CHANGES
Values: lambdas/GetAllGamesSearchFunction lambdas/GetNavigationFunction lambdas/GetGameConfigFunction lambdas/GetGameInfoFunction lambdas/GetGamesFunction lambdas/GetSectionsFunction layers/OSClientLayer

Variable: ENVS
Values: stg_eu00 prod_eu00

```

## Architecture & deeper docs

### API Design Decisions

URL structure, member identification, and how personalised resources are modelled are documented under [docs/api-design](./docs/api-design/index.mdx):

- [URL structure](./docs/api-design/url-structure.mdx)
- [Member identification](./docs/api-design/member-identification.mdx)
- [Personalised sub-resources](./docs/api-design/personalised-resources.mdx)

### Resilience & API Tiers

Part of ongoing resilience work — endpoints are classified into tiers (A / B / C and non-live traffic) so non-critical paths can be shed under high or critical load while the core user journey is preserved. Documented under [docs/resilience](./docs/resilience/index.mdx):

- [Service tiers](./docs/resilience/service-tiers.mdx)

## Contributing

### Add a new lambda

#### Pre-reqs

```sh
cargo install kickstart
```

#### OpenSearch lambda

```sh
cd functions
kickstart git@gitlab.ballys.tech:excite/native/templates/aws-lambda-template-ts-opensearch-v3.git
```

Go into the `README.md` of the new lambda and go to the section `Add the Cloudformation template to the top level template.toml`. Add the sections to the config as instructed.

Go to the top level of the lambda repo.

```sh
sam build
```

Go into the `README.md` of the new lambda and at the bottom you'll find the `sam local invoke` line you need to run to test the lambda locally.

#### External

- The [Lobby Contracts](https://gitlab.ballys.tech/excite/native/applications/lobby-contracts) for the lambdas
- [OpenSearch dev indexes](https://search-lobby-opsearch-oc5o7t2piau33hcu5ej3ortis4.aos.eu-west-1.on.aws/_dashboards/app/opensearch_index_management_dashboards#/indices?from=0&search=&showDataStreams=false&size=20&sortDirection=desc&sortField=index)

### Add a resource to your application

The application template uses AWS Serverless Application Model (AWS SAM) to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in [the SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), you can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

### Commit Message Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. The commit message should be structured as follows:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

Example:

```text
feat(auth): add login functionality

Implement JWT-based authentication with refresh tokens
```

The commit linting is enforced via pre-commit hooks using commitlint.

## Resources

- See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.
- [Lambda runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
- [Working with lambda layers](https://docs.aws.amazon.com/lambda/latest/dg/chapter-layers.html)
- [Building layers](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/building-layers.html)
- [Layer versions](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-layerversion.html)
- [AWS::CloudFormation::Stack](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudformation-stack.html)
- [AWS SAM template anatomy](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy.html)
- [Using AWS SAM with layers](https://docs.aws.amazon.com/lambda/latest/dg/layers-sam.html)
- [Lambda layers with SAM](https://aws.amazon.com/blogs/compute/working-with-aws-lambda-and-lambda-layers-in-aws-sam/)
- [Deploy Node.js Lambda functions with .zip file archives](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html)
- [Local development with lambda layers](https://stackoverflow.com/questions/76702621/import-lambda-layers-locally)
- [Using nested applications](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-template-nested-applications.html)
- [Working with nested stacks](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-nested-stacks.html)
- [Nested stack demo guthub sample project](https://github.com/aws-samples/sam-accelerate-nested-stacks-demo)
- [aws serverless-application-model-repo](https://github.com/aws/serverless-application-model/blob/master/docs/internals/generated_resources.rst#api)
- [Lambdas with Typescript amd SAM](https://www.youtube.com/watch?v=GykEaUKDcrk)
