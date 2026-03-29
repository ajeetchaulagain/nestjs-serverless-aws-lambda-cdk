import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as path from 'path';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nodeModulesLayer = new lambda.LayerVersion(this, 'NodeModulesLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../layer')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Production node_modules for NestJS Lambda',
    });

    const nestApiLambda = new lambda.Function(this, 'NestApiLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'src/lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist'), {
        exclude: ['infra', 'tsconfig*'],
      }),
      memorySize: 512,
      layers: [nodeModulesLayer],
    });

    const httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      defaultIntegration: new integrations.HttpLambdaIntegration(
        'LambdaIntegration',
        nestApiLambda,
      ),
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.url!,
    });
  }
}
