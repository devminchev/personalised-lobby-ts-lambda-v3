# Get-game-shuffle Lambda Function

> Provides s list of games based on rtp criteria for the game shuffle feature

The lambda retrieves the categories for a specific venture for the endpoint `/sites/{sitename}/platform/{platform}/game-shuffle`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v3.html)

## Local development

### Add the Cloudformation template to the top level `template.toml`

Under `Resources` add:

```yml
# get-game-shuffle
GetGameShuffleFunction:
    Type: AWS::Serverless::Function
    Properties:
        CodeUri: ./lambdas/GetGameShuffleFunction/ # Folder of the lambda function
        Handler: app.lambdaHandler # Adjust the handler path to dist/app.lambdaHandler
        Runtime: nodejs20.x
        Environment:
            Variables:
                HOST: https://search-lobby-opsearch-oc5o7t2piau33hcu5ej3ortis4.eu-west-1.es.amazonaws.com/
                OS_USER: !Sub '{{resolve:ssm:/personalised-lobby/dev/OS_USER:2}}'
                OS_PASS: !Sub '{{resolve:ssm:/personalised-lobby/dev/OS_PASS:2}}'
                CONTENTFUL_SPACE_LOCALE: !Sub '{{resolve:ssm:/personalised-lobby/dev/CONTENTFUL_SPACE_LOCALE:1}}'
        Architectures:
            - !Ref LambdaArchitecture
        Events:
            GetGameShuffle:
                Type: Api
                Properties:
                    Path: /sites/{sitename}/platform/{platform}/game-shuffle
                    Method: get
                    RestApiId:
                        Ref: GetGameShuffleAPI
    Metadata:
        BuildMethod: esbuild
        BuildProperties:
            Minify: true
            Target: es2020
            EntryPoints:
                - app.ts
            External:
                - os-client
                - /opt/nodejs/node_modules/os-client

GetGameShuffleAPI:
    Type: AWS::Serverless::Api
    Properties:
        StageName: !Ref StageName
        OpenApiVersion: '2.0'
        EndpointConfiguration:
            Type: REGIONAL
        DefinitionBody:
            swagger: '2.0'
            info:
                title: 'API for GetGameShuffleFunction'
            paths:
                /sites/{sitename}/platform/{platform}/game-shuffle:
                    get:
                        produces:
                            - 'application/json'
                        responses:
                            '200':
                                description: '200 response'
                        x-amazon-apigateway-integration:
                            uri:
                                Fn::Sub: arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetGameShuffleFunction.Arn}/invocations
                            responses:
                                default:
                                    statusCode: '200'
                            passthroughBehavior: 'when_no_match'
                            httpMethod: 'POST'
                            type: 'aws_proxy'
```

Under `Outputs` add:

```yml
# get-game-shuffle
GetGameShuffleAPI:
    Description: API Gateway endpoint URL for GetGameShuffleFunction function
    Value: !Sub 'https://${GetGameShuffleAPI}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/sites/{sitename}/platform/{platform}/game-shuffle'
GetGameShuffleFunction:
    Description: GetGameShuffleFunction Lambda Function ARN
    Value: !GetAtt GetGameShuffleFunction.Arn
GetGameShuffleFunctionIamRole:
    Description: Implicit IAM Role created for GetGameShuffleFunction function
    Value: !GetAtt GetGameShuffleFunctionRole.Arn
```

_Note: Outputs are needed for deployments to AWS. If we switch to terraform in the future, this will not be needed._

## Testing locally

To build the lambda locally run `sam build` from top level.

After a successful `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetGameShuffleFunction" -e functions/GetGameShuffleFunction/events/event.eu.json | jq
```
