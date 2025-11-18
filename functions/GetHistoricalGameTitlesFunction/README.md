# Get-historical-game-titles Lambda Function

> format list of game titles and server it back to client via Lambda

The lambda retrieves the categories for a specific venture for the endpoint `/v1/site/{sitename}/historical-game-titles`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v1.html#tag/Categories/paths/~1categories~1sitenames~1%7Bsitename%7D/get)

## Local development

### Local invoke with sam

Neither the lambdas nor the lambda-layers need to be build locally before building with sam as `sam build` itself will take care of that.

To build the lambda locally run `sam build` from top level.

After a successful `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetHistoricalGameTitlesFunction" -e lambdas/GetHistoricalGameTitlesFunction/events/event.json --env-vars env.json
```
