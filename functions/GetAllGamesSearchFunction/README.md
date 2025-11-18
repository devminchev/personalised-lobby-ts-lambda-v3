# GetAllGamesSearchFunction Lambda Function

> Returns a list of all searchable games for the venture

The lambda retrieves the categories for a specific venture for the endpoint `/content/sites/{sitename}/platform/{platform}/search`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v1.html#tag/Categories/paths/~1categories~1sitenames~1%7Bsitename%7D/get)

## Game Search fetch logic and reasoning

**1. `getVentureId` (method name: `getVentureId`)** - get the ventureId from the `ventures` index from the name provided us by the client in the pathParameters of the HTTP request.

**2. `getCategories` (method name: `getCategories`)** - make a OS query to the `categories` index to get all categories on the venture. For valid categories we should receive 1:1 web to native (for each web should exist a native category) for it to be valid.

    - Filter out the `web` and `app` by platform.

**3. `getCategoryData` (method name: `getLayoutNames`)** - make a OS query to the `categories` index to get the category data, we are only interested in the `caterory.name` and the `category.id`:

    - The `category.name` is used as identifier in `Contentful` for a type of category, because not all categories have games in them. So we filter out only for `category.name` = 'homepage' or 'category'.
    - The `category.id` is used as the name for the layout, with with we can query the `layouts` index in OpenSearch.

After the query and filtering out by `category.name` we construct an array of layout names.

```js
['homepage', 'bingo', 'casino', 'jackpots'];
```

**4. `getLayouts` (method name: `getSectionIds`)** - we query the `layouts` index using the layouts name array to get all the layouts information. we are only interested in the `name` and `sections` from the payload of that query:

    - The `name` we need to keep, because in the response to the client we need to provide it
    - The `sections` array contains the ids of all sections belonging to that particular layout. We need that to query the `sections` index afterwards.

After retrieving the `sections` we create a dictionary holding a mapping which sections belong to which layout. The `key` is the `layout.name` and the value is a transformed array of [...`sections.id`]
We also construct an array holding ALL `sections.id`s across ALL layouts, as we will need this for the next OpenSearch query to the `sections` index.

The method returns in the end BOTH the `layout:section` dictionary and the complete `[...sections.id]` array.

**5.`getSectionsSiteGames` (method name: `getGamesListForSectionSearch`)**:

- (method name: `generateQueryFromDict`) - creates an aggregation query to the `sections` index in OpenSearch using the `layout:search` dictionary and the `[sections.id]` array. This gives us the results in an aggregated manner where the retrieved information for each section (we only care and retrieve the `section.games`) will be aggregated under the `layout.name` the section belongs to. This removes the need of keeping another mapping in memory and having to search and match the `sitegame.ids` to the `layouts` later on.

- (method name: `extractLayoutToGameDictFromAggregation`) - Processes the aggregated response, creating as a result an array of `[section.sitegame.ids]` for all sections from all layouts, AND a dictionary containing `sitegame.id: [layout.names]` (the id: name is more efficient we have direct access by the `sitegame.id`). This dictionary will be used directly when we create the final payload to return which categories/layouts a game belongs to.

**6. `getSiteGamesAndGames` (method name: `getGamesSiteGames`)** - query the OS `games` index using the `[sitegame.ids]` array to get the information about the `siteGame` and it's `game` parent. We only care about certain fields so to make the query more eeficient we only retrieve those:

- for the `siteGame`: `"_source": ["siteGame.id"]`
- for the `game`: `"_source": ["game.gamePlatformConfig", "game.title", "game.infoImgUrlPattern", "game.loggedOutImgUrlPattern"]`

- Additionaly, because this is a complex query (because of the parent:child relationship) which can become slower when we have large amount of items, to make the query a bit faster we can limit the number of documents that need to be looked at, by restricting them only for the specific venture the request is coming from (adding a match by `siteGame.venture.id` before the `parent:child` match).

    ```json
        match: {
            "siteGame.venture.en-GB.sys.id": "259MUOgLpQf5hVGxjNM5f2"
        }
    ```

    so the final query looks like this:

    ```json
      {
          "query": {
              "bool": {
                  "must": [
                      {
                          "match": {
                              "siteGame.venture.en-GB.sys.id": "259MUOgLpQf5hVGxjNM5f2"
                          }
                      },
                      {
                          "has_parent": {
                              "parent_type": "game",
                              "query": {
                                  "match_all": {},
                              },
                              "inner_hits": {
                                  "_source": ["game.gamePlatformConfig", "game.title", "game.infoImgUrlPattern", "game.loggedOutImgUrlPattern"]
                              },
                          },
                      },
                      {
                          "terms": {
                              "_id": allSiteGameIds,
                          },
                      },
                  ],
              },
          },
          "_source": ["siteGame.id"],
          "size": 10000,
      }
    ```

**7. Create the final payload (method name: `constructGameSearchResponse`)** - constructs the final payload from the `games` index reponse and the `sitegame.id: [layout.names]` dictionary for each game.

## Local development

_Note: Outputs are needed for deployments to AWS. If we switch to terraform in the future, this will not be needed._

### Local invoke with sam

Neither the lambdas nor the lambda-layers need to be build locally before building with sam as `sam build` itself will take care of that.

To build the lambda locally run `sam build` from top level.

After a successful `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetAllGamesSearchFunction" -e lambdas/GetAllGamesSearchFunction/events/event.json --env-vars env.json
```
