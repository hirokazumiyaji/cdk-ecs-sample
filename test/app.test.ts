import { expect as expect, matchTemplate, MatchStyle } from '@aws-cdk/assert'
import { App } from '@aws-cdk/core'
import { NetworkStack } from '../lib/network-stack'

const context = {
  service: 'test',
  environment: 'test',
  network: {
    vpcCidr: "192.168.0.0/16",
    maxAzs: 2,
    ingressSubnetCidrMask: 24,
    backendSubnetCidrMask: 24,
    rdsSubnetCidrMask: 28
  },
  frontend: {
    bucketName: ''
  },
  rds: {
    masterUser: {
      username: '',
      password: ''
    },
    instanceType: '',
    instances: 1,
    defaultDatabaseName: '' 
  }
}

test('NetworkStack', () => {
  const app = new App()
  // WHEN
  const stack = new NetworkStack(app, 'NetworkStack', context)
  // THEN
  expect(stack).to(matchTemplate({ "Resources": {} }, MatchStyle.EXACT))
});
