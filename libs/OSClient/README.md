# os-client library

The library provides the connection to OpenSearch and will be used by the API lambdas in order to query data from the OpenSearch instance.

## Local development

Simply run yarn inside the package to get the necessary dependencies and then `yarn build`.

To run the test locally run `yarn test`.

Since this is a library it's meant to be used in conjunction with a lambda function. In order to be able to test your changes amend the unit tests, but more importantly run the changes locally together with the lambda function which uses it.

To do that from top level of the project simply run:

```sh
sam build --parameter-overrides "FunctionName={YourLambdaFunction} libraryName=OSClientlibrary LambdaArchitecture=arm64"
```

and then run it locally with

```sh
sam local invoke "{YourLambdaFunction}" -e lambdas/{your-lambda-function}/events/event.json --env-vars env.json
```

For example if you want to test it with the get-navigation lambda function:

```sh
sam build --parameter-overrides "FunctionName=GetNavigationFunction libraryName=OSClientlibrary LambdaArchitecture=arm64"

sam local invoke "GetNavigationFunction" -e lambdas/get-navigation/events/event.json --env-vars env.json
```

## Decisions

### localization

There are two concepts for localization in regards to the Contentful models that need to be kept in mind when processing the payloads:

1. Contentful space localization - this is a default localization applied to all fields in the payload returned by Contentful. It is basd on the localization where the Contentful space is located. For example for all EU data (including UK, Spain, Sweden), the space localization will be "en-GB".
2. Localization override for localized fields - this is localization based on language needed for a specific venture for example. Some of the text fields in the models will have an override, depending on the language if the country the venture is targeting.

Because the `Contentful Space based localization` is dependant on the region where the Contentful Space is deployed, there are 2 environment variables that allows this to be passed to the library code via the lambdas - `REGION` and `CONTENTFUL_SPACE_LOCALE`.

```yml
    Environment:
        Variables:
            REGION: !Sub '{{resolve:ssm:/personalised-lobby/dev/REGION:1}}'
            CONTENTFUL_SPACE_LOCALE: !Sub '{{resolve:ssm:/personalised-lobby/dev/CONTENTFUL_SPACE_LOCALE:1}}'
        ...
```

The handling for the `Contentful Space based localization` and the `Localization override` is handled in the `localization.ts`.

The `handleSpaceLocalization` method is responsible for returning the correct language localization for all the fields that do not have a localization override. It's used by the lambdas to determine correctly the keys for some of the OpenSearch queries, as well as for accessing certain payload object properties that are under space localization.

```ts
const spaceLocale = handleSpaceLocalization();
// Usage constructing OpenSearch query
const key = `name.${spaceLocale}`;
    const matchExpression: any = {
        match: {},
    };
    matchExpression.match[key] = siteName;

    const getVenturesQuery: any = {
        _source: ['id'],
        query: {
        bool: {
                must: matchExpression,
            },
        },
    };

    ....
// Usage accessing payload object properties
    return {
        href: section?.href?.[spaceLocale],
        image: section?.image?.[spaceLocale]
    }
```
