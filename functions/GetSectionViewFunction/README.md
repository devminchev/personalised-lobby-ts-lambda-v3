# Get-section-view Lambda Function

> section view that displays games and jackpots

The lambda retrieves the categories for a specific venture for the endpoint `content/sites/{sitename}/platform/{platform}/section/{sectionslug}`.
Full contract can be found [here](http://static0.psnative.pgt.gaia/personalised_lobby/personalised-lobby-v3.html)

## Local development

### Add the Cloudformation template to the top level `template.toml`

Under `Resources` add:

```yml
# get-section-view
GetSectionViewFunction:
    Type: AWS::Serverless::Function
    Properties:
        CodeUri: ./lambdas/GetSectionViewFunction/ # Folder of the lambda function
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
            GetSectionView:
                Type: Api
                Properties:
                    Path: content/sites/{sitename}/platform/{platform}/section/{sectionslug}
                    Method: get
                    RestApiId:
                        Ref: GetSectionViewAPI
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

GetSectionViewAPI:
    Type: AWS::Serverless::Api
    Properties:
        StageName: !Ref StageName
        OpenApiVersion: '2.0'
        EndpointConfiguration:
            Type: REGIONAL
        DefinitionBody:
            swagger: '2.0'
            info:
                title: 'API for GetSectionViewFunction'
            paths:
                content/sites/{sitename}/platform/{platform}/section/{sectionslug}:
                    get:
                        produces:
                            - 'application/json'
                        responses:
                            '200':
                                description: '200 response'
                        x-amazon-apigateway-integration:
                            uri:
                                Fn::Sub: arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetSectionViewFunction.Arn}/invocations
                            responses:
                                default:
                                    statusCode: '200'
                            passthroughBehavior: 'when_no_match'
                            httpMethod: 'POST'
                            type: 'aws_proxy'
```

Under `Outputs` add:

```yml
# get-section-view
GetSectionViewAPI:
    Description: API Gateway endpoint URL for GetSectionViewFunction function
    Value: !Sub 'https://${GetSectionViewAPI}.execute-api.${AWS::Region}.amazonaws.com/${StageName}content/sites/{sitename}/platform/{platform}/section/{sectionslug}'
GetSectionViewFunction:
    Description: GetSectionViewFunction Lambda Function ARN
    Value: !GetAtt GetSectionViewFunction.Arn
GetSectionViewFunctionIamRole:
    Description: Implicit IAM Role created for GetSectionViewFunction function
    Value: !GetAtt GetSectionViewFunctionRole.Arn
```

_Note: Outputs are needed for deployments to AWS. If we switch to terraform in the future, this will not be needed._

## Testing locally

To build the lambda locally run `sam build` from top level.

After a successful `sam-build` to invoke the lambda locally provide the function name as well as the path to the events.json triggering the lambda and the path to the env.json file for the credentials. The command is ran from top level as well.

```sh
    sam local invoke "GetSectionViewFunction" -e functions/GetSectionViewFunction/events/event.json --env-vars env.json
```
