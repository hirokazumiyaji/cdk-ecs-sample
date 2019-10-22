import { Construct, SecretValue, Stack, StackProps, Tag } from '@aws-cdk/core'
import { InstanceType, SecurityGroup, Vpc } from '@aws-cdk/aws-ec2'
import { ClusterParameterGroup, DatabaseCluster, DatabaseClusterEngine } from '@aws-cdk/aws-rds'
import { Context } from '../types/context'

interface RDSStackProps extends StackProps, Context {
  vpc: Vpc
  securityGroup: SecurityGroup
}

export class RDSStack extends Stack {
  public readonly databaseCluster: DatabaseCluster

  constructor(scope: Construct, id: string, props: RDSStackProps) {
    super(scope, id, props)

    const clusterParameterGroup = new ClusterParameterGroup(
      this,
      'ClusterParameterGroup',
      {
        family: 'aurora-mysql5.7',
        parameters: {
          'max_connections': '100'
        }
      }
    )
    const databaseCluster = new DatabaseCluster(
      this,
      'DatabaseCluster',
      {
        engine: DatabaseClusterEngine.AURORA_MYSQL,
        masterUser: {
          username: props.rds.masterUser.username,
          password: SecretValue.plainText(props.rds.masterUser.password)
        },
        instanceProps: {
          instanceType: new InstanceType(props.rds.instanceType),
          vpc: props.vpc,
          vpcSubnets: {
            subnetGroupName: 'SubnetRDS'
          },
          securityGroup: props.securityGroup
        },
        instances: props.rds.instances,
        defaultDatabaseName: props.rds.defaultDatabaseName,
        parameterGroup: clusterParameterGroup
      }
    )
    databaseCluster.node.applyAspect(new Tag('Name', `${props.service} ${props.environment}`))
    databaseCluster.node.applyAspect(new Tag('Service', props.service))
    databaseCluster.node.applyAspect(new Tag('Environment', props.environment))

    this.databaseCluster = databaseCluster
  }
}
