# Get-minigames Lambda Function

> fetch minigames

The lambda retrieves the categories for a specific venture for the endpoint `/sites/{sitename}/platform/{platform}/minigames`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v1.html#tag/Categories/paths/~1categories~1sitenames~1%7Bsitename%7D/get)

## Local development

### Add the Cloudformation template to the top level `template.toml`

Under `Resources` add:

```yml
# get-minigames
GetMiniGamesFunction:
    Type: AWS::Serverless::Function
    Properties:
        CodeUri: ./lambdas/GetMiniGamesFunction/ # Folder of the lambda function
        Handler: app.lambdaHandler # Adjust the handler path to dist/app.lambdaHandler
        Runtime: nodejs20.x
        Layers:
            # - !ImportValue OSClientLayerArn
            - !Ref OSClientLayer
        Environment:
            Variables:
                HOST: https://search-lobby-opsearch-oc5o7t2piau33hcu5ej3ortis4.eu-west-1.es.amazonaws.com/
                OS_USER: !Sub '{{resolve:ssm:/personalised-lobby/dev/OS_USER:2}}'
                OS_PASS: !Sub '{{resolve:ssm:/personalised-lobby/dev/OS_PASS:2}}'
                CONTENTFUL_SPACE_LOCALE: !Sub '{{resolve:ssm:/personalised-lobby/dev/CONTENTFUL_SPACE_LOCALE:1}}'
        Architectures:
            - !Ref LambdaArchitecture
        Events:
            GetMiniGames:
                Type: Api
                Properties:
                    Path: /sites/{sitename}/platform/{platform}/minigames
                    Method: get
                    RestApiId:
                        Ref: GetMiniGamesAPI
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

GetMiniGamesAPI:
    Type: AWS::Serverless::Api
    Properties:
        StageName: !Ref StageName
        OpenApiVersion: '2.0'
        EndpointConfiguration:
            Type: REGIONAL
        DefinitionBody:
            swagger: '2.0'
            info:
                title: 'API for GetMiniGamesFunction'
            paths:
                /sites/{sitename}/platform/{platform}/minigames:
                    get:
                        produces:
                            - 'application/json'
                        responses:
                            '200':
                                description: '200 response'
                        x-amazon-apigateway-integration:
                            uri:
                                Fn::Sub: arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetMiniGamesFunction.Arn}/invocations
                            responses:
                                default:
                                    statusCode: '200'
                            passthroughBehavior: 'when_no_match'
                            httpMethod: 'POST'
                            type: 'aws_proxy'
```

Under `Outputs` add:

```yml
# get-minigames
GetMiniGamesAPI:
    Description: API Gateway endpoint URL for GetMiniGamesFunction function
    Value: !Sub 'https://${GetMiniGamesAPI}.execute-api.${AWS::Region}.amazonaws.com/${StageName}/sites/{sitename}/platform/{platform}/minigames'
GetMiniGamesFunction:
    Description: GetMiniGamesFunction Lambda Function ARN
    Value: !GetAtt GetMiniGamesFunction.Arn
GetMiniGamesFunctionIamRole:
    Description: Implicit IAM Role created for GetMiniGamesFunction function
    Value: !GetAtt GetMiniGamesFunctionRole.Arn
```

_Note: Outputs are needed for deployments to AWS. If we switch to terraform in the future, this will not be needed._

### Local invoke with sam

Neither the lambdas nor the lambda-layers need to be build locally before building with sam as `sam build` itself will take care of that.

To build the lambda locally run `sam build` from top level.

After a successful `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetMiniGamesFunction" -e lambdas/GetMiniGamesFunction/events/event.json --env-vars env.json
```
