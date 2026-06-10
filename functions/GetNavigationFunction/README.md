# GetCategories function

The lambda retrieves the categories for a specific venture for the endpoint `/sites/%7Bsitename%7D/categories`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v1.html#tag/Categories/paths/~1categories~1sites~1%7Bsitename%7D/get)

## Local development

### Local development for the getCategories function

The function imports `os-client` as a workspace dependency by package name in order to be able to initiate a connection to OpenSearch.

```ts
import { getClient, IClient } from 'os-client';
```

`os-client` is a workspace library that is resolved from source by the nx project graph and bundled by esbuild. No per-function tsconfig path mapping is needed — the per-project `tsconfig.json` only extends `../../tsconfig.base.json`.

### Local invoke with sam

The lambdas do not need to be built locally before building with sam as `sam build` itself will take care of that.

To build the lambda locally run `sam build` from top level.

After a succesfull `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetNavigationFunction" -e lambdas/GetNavigationFunction/events/event.json --env-vars env.json
```
