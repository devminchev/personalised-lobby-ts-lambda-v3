# GetCategories function

The lambda retrieves the categories for a specific venture for the endpoint `/sites/%7Bsitename%7D/categories`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v1.html#tag/Categories/paths/~1categories~1sites~1%7Bsitename%7D/get)

## Local development

### Local development for the getCategories function

The function uses the `os-client` layer available under `layers/os-client` in order to be able to initiate a connection to OpenSearch.
In order to be able to develop locally as well as the layer import to work on production, the import point to the location where AWS organizes the layer code inside the container.

```ts
import { getClient, IClient } from '/opt/nodejs/node_modules/os-client';
```

Since this import won't be resolve locally there is a configuration in the `tsconfig.json` file which maps the path to the local module.

```json
{
    "compilerOptions": {
        "paths": {
            "/opt/nodejs/node_modules/os-client": ["../../layers/OSClientLayer/index.ts"]
        }
    }
}
```

This is so the `os-client` layer dependency can be found locally and you don't get any errors.

### Local invoke with sam

Neither the lambdas nor the layers need to be build locally before building with sam as `sam build` itself will take care of that.

To build the lambda locally run `sam build` from top level.

After a succesfull `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetNavigationFunction" -e lambdas/GetNavigationFunction/events/event.json --env-vars env.json
```
