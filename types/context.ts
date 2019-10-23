export interface Context {
  service: string
  environment: string
  network: {
    vpcCidr: string
    maxAzs: number
    ingressSubnetCidrMask: number
    backendSubnetCidrMask: number
    rdsSubnetCidrMask: number
  }
  frontend: {
    bucketName: string
  }
  backend: {
    repositoryName: string
    cluster: {
      serviceName: string
      autoScalingGroup: {
        desiredCapacity: number
        maxCapacity: number
      }
      ec2Service: {
        desiredCount: number
      }
    }
    container: {
      memoryLimitMiB: number
      containerPorts: number[]
    }
    instance: {
      instanceType: string
    }
  }
  rds: {
    masterUser: {
      username: string
      password: string
    }
    instanceType: string
    instances: number
    defaultDatabaseName: string
  }
}
