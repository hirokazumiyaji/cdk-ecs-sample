export interface Context {
  service: string
  environment: string
  network: {
    vpcCidr: string
    maxAzs: number
    ingressSubnetCidrMask: number
    backendSubnetCidrMask: number
    rdsSubnetCidrMask: number
  },
  frontend: {
    bucketName: string
  },
  rds: {
    masterUser: {
      username: string
      password: string
    },
    instanceType: string
    instances: number
    defaultDatabaseName: string
  }
}
