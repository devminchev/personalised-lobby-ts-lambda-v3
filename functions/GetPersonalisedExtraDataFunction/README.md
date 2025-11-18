# Get-games Lambda Function

> Get games for a section

The lambda retrieves the categories for a specific venture for the endpoint `/sections/{sectionid}/sitegames?member={memberId}`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v1.html#tag/Categories/paths/~1categories~1sites~1%7Bsitename%7D/get)

## Local development

### Local invoke with sam

Neither the lambdas nor the layers need to be build locally before building with sam as `sam build` itself will take care of that.

To build the lambda locally run `sam build` from top level.

After a successful `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetBecauseYouPlayedFunction" -e lambdas/GetBecauseYouPlayedFunction/events/event.json --env-vars env.json
```

## Pagination

### Basic Pagination Concept

`size`: This parameter controls how many results to return in your response.
`from`: This parameter specifies the offset from the first result you want to retrieve. This allows you to "skip" over a set number of results.

#### How to Implement Pagination

For the initial request, you might not use the from parameter, or set it to 0, and just set size to the number of results you want per page. For subsequent requests, you increment the from parameter by the size of the previous pages.

Here's how you can calculate the from parameter for pagination:

##### First Page Request

```json
{
    "from": 0,
    "size": 10,
    "query": {
        "match_all": {}
    }
}
```

##### Second Page Request

```json
{
    "from": 10, // This is size of the first page
    "size": 10,
    "query": {
        "match_all": {}
    }
}
```

##### THird Page Request

```json
{
    "from": 20, // This is size of the first page + size of the second page
    "size": 10,
    "query": {
        "match_all": {}
    }
}
```

#### Considerations

Performance: As you paginate deeper into the dataset (i.e., a very high from value), performance might degrade because OpenSearch has to count through more data to get to the offset. For very large datasets or deep pagination, consider using the "Search After" feature which is more efficient for deep pagination.

#### Search After: This method is recommended for deep pagination. It uses the last result of the previous query as a point to start the next query. This is more efficient than using from and size for large datasets.

Here’s an example using search_after:

##### Initial Request

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

##### Subsequent Request (using the last \_id from the previous batch)

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

##### Steps to Calculate last_id_from_previous_batch

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

2. Extract the Last Sort Value: When you receive your search results, you need to look at the sort values of the last document in the result set. This is typically returned in the search hits under the \_source or directly in the sort values.

3. Use This Value in the Next Search: For your subsequent query, use these sort values in the search_after parameter to start the next query right after the last document of your previous batch.

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
