# Get-sections Lambda Function

> Get the sections for a category

The lambda retrieves the categories for a specific venture for the endpoint `/sites/{siteName}/layouts/{layoutName}/platform/{platform}/sections?member={memberId}`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v1.html#tag/Categories/paths/~1categories~1sites~1%7Bsitename%7D/get)

## Local development

### Add the Cloudformation template to the top level `template.toml`

Under `Resources` add:

```yml
# get-sections
GetViewFunction:
    Type: AWS::Serverless::Function
    Properties:
        CodeUri: ./lambdas/GetViewFunction/ # Folder of the lambda function
        Handler: app.lambdaHandler # Adjust the handler path to dist/app.lambdaHandler
        Runtime: nodejs20.x
        Layers:
            # - !ImportValue OSClientLayerArn
            - !Ref OSClientLayer
        Environment:
            Variables:
                HOST: https://search-lobby-opsearch-oc5o7t2piau33hcu5ej3ortis4.eu-west-1.es.amazonaws.com/
                OS_USER: !Sub '{{resolve:ssm:/personalised-lobby/dev/OS_USER:1}}'
                OS_PASS: !Sub '{{resolve:ssm:/personalised-lobby/dev/OS_PASS:1}}'
                API_KEY: !Sub '{{resolve:ssm:/personalised-lobby/dev/API_KEY:1}}'
        Architectures:
            - !Ref LambdaArchitecture
        Events:
            GetCategories:
                Type: Api
                Properties:
                    Path: /sites/{siteName}/layouts/{layoutName}/platform/{platform}/sections?member={memberId}
                    Method: get
                    RestApiId:
                        Ref: GetSectionsApi
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

GetSectionsApi:
    Type: AWS::Serverless::Api
    Properties:
        StageName: !Ref StageName
        OpenApiVersion: '2.0'
        EndpointConfiguration:
            Type: REGIONAL
        DefinitionBody:
            swagger: '2.0'
            info:
                title: 'API for GetViewFunction'
            paths:
                /sites/{siteName}/layouts/{layoutName}/platform/{platform}/sections?member={memberId}:
                    get:
                        produces:
                            - 'application/json'
                        responses:
                            '200':
                                description: '200 response'
                        x-amazon-apigateway-integration:
                            uri:
                                Fn::Sub: arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetViewFunction.Arn}/invocations
                            responses:
                                default:
                                    statusCode: '200'
                            passthroughBehavior: 'when_no_match'
                            httpMethod: 'POST'
                            type: 'aws_proxy'
```

Under `Outputs` add:

```yml
# get-sections
GetSectionsApi:
    Description: API Gateway endpoint URL for get-sections function
    Value: !Sub 'https://${GetSectionsApi}.execute-api.${AWS::Region}.amazonaws.com/content/${StageName}/sites/{siteName}/layouts/{layoutName}/platform/{platform}/sections?member={memberId}'
GetViewFunction:
    Description: get-sections Lambda Function ARN
    Value: !GetAtt GetViewFunction.Arn
GetSectionsFunctionIamRole:
    Description: Implicit IAM Role created for get-sections function
    Value: !GetAtt GetSectionsFunctionRole.Arn
```

_Note: Outputs are needed for deployments to AWS. If we switch to terraform in the future, this will not be needed._

### Local invoke with sam

Neither the lambdas nor the layers need to be build locally before building with sam as `sam build` itself will take care of that.

To build the lambda locally run `sam build` from top level.

After a successful `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetViewFunction" -e functions/GetViewFunction/events/event.json --env-vars env.json
```
