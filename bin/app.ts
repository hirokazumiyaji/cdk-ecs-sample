#!/usr/bin/env node
import 'source-map-support/register'
import { App } from '@aws-cdk/core'
import { Context } from '../types/context'
import { NetworkStack } from '../lib/network-stack'
import { RDSStack } from '../lib/rds-stack'
import { FrontendStack } from '../lib/frontend-stack'
import { BackendStack } from '../lib/backend-stack'

const app = new App()

const service: string = app.node.tryGetContext('service')
const environment: string = app.node.tryGetContext('environment')
const parameters: Context = {
  service: service,
  environment: environment,
  ...app.node.tryGetContext(environment)
}
parameters.rds.masterUser.username = process.env.RDS_MASTER_USERNAME!!
parameters.rds.masterUser.password = process.env.RDS_MASTER_PASSWORD!!

const networkStack = new NetworkStack(app, 'NetworkStack', parameters)
const rdsStack = new RDSStack(
  app,
  'RDSStack',
  {
    vpc: networkStack.vpc,
    securityGroup: networkStack.rdsSecurityGroup,
    ...parameters
  }
)
const frontendStack = new FrontendStack(app, 'FrontendStack', parameters)
const backendStack = new BackendStack(app, 'BackendStack', parameters)
