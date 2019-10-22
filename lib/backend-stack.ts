import { Construct, Duration, Stack, StackProps, Tag } from '@aws-cdk/core'
import {
  Cluster,
  Compatibility,
  ContainerImage,
  Ec2Service,
  EcsOptimizedImage,
  NetworkMode,
  PortMapping,
  TaskDefinition
} from '@aws-cdk/aws-ecs'
import { AutoScalingGroup } from '@aws-cdk/aws-autoscaling'
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  SecurityGroup,
  Vpc,
  SubnetType,
  UserData
} from '@aws-cdk/aws-ec2'
import { Repository } from '@aws-cdk/aws-ecr'
import {
  AddApplicationTargetsProps,
  ApplicationLoadBalancer,
  ApplicationProtocol
} from '@aws-cdk/aws-elasticloadbalancingv2'
import { DatabaseCluster } from '@aws-cdk/aws-rds'
import { Context } from '../types/context'

interface BackendStackProps extends StackProps, Context {
  vpc: Vpc
  ingressSecurityGroup: SecurityGroup
  backendSecurityGroup: SecurityGroup
  databaseCluster: DatabaseCluster
}

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)

    const applicationLoadBalancer = new ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc: props.vpc,
        vpcSubnets: { subnetGroupName: 'SubnetIngress' },
        securityGroup: props.ingressSecurityGroup,
        loadBalancerName: `${props.service}-${props.environment}`,
        internetFacing: true
      }
    )
    applicationLoadBalancer.node.applyAspect(new Tag('Name', `${props.service}-${props.environment}`))
    applicationLoadBalancer.node.applyAspect(new Tag('Service', props.service))
    applicationLoadBalancer.node.applyAspect(new Tag('Environment', props.environment))

    const userData = UserData.forLinux()
    userData.addCommands(
      'yum update -y',
      'yum install -y jq',
      'region=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r .region)',
      'yum install -y https://amazon-ssm-$region.s3.amazonaws.com/latest/linux_amd64/amazon-ssm-agent.rpm'
    )
    const autoScalingGroup = new AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc: props.vpc,
        vpcSubnets: { subnetGroupName: 'SubnetBackend' },
        instanceType: new InstanceType(props.backend.instance.instanceType),
        machineImage: EcsOptimizedImage.amazonLinux(),
        desiredCapacity: props.backend.cluster.autoScalingGroup.desiredCapacity,
        maxCapacity: props.backend.cluster.autoScalingGroup.maxCapacity,
        userData: userData
      }
    )
    autoScalingGroup.addSecurityGroup(props.backendSecurityGroup)
    autoScalingGroup.node.applyAspect(new Tag('Name', `${props.service}-${props.environment}`))
    autoScalingGroup.node.applyAspect(new Tag('Service', props.service))
    autoScalingGroup.node.applyAspect(new Tag('Environment', props.environment))

    const cluster = new Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: `${props.service}-${props.environment}`
    })
    cluster.addAutoScalingGroup(autoScalingGroup)
    cluster.node.applyAspect(new Tag('Name', `${props.service}-${props.environment}`))
    cluster.node.applyAspect(new Tag('Service', props.service))
    cluster.node.applyAspect(new Tag('Environment', props.environment))

    const repository = new Repository(this, 'Repository', {
      repositoryName: props.backend.repositoryName
    })
    repository.node.applyAspect(new Tag('Name', `${props.service}-${props.environment}`))
    repository.node.applyAspect(new Tag('Service', props.service))
    repository.node.applyAspect(new Tag('Environment', props.environment))

    const image = ContainerImage.fromEcrRepository(repository)
    const taskDefinition = new TaskDefinition(this, 'TaskDefinition', {
      networkMode: NetworkMode.BRIDGE,
      compatibility: Compatibility.EC2
    })

    const container = taskDefinition.addContainer('AppContainer', {
      image: image,
      cpu: props.backend.container.cpu,
      memoryLimitMiB: props.backend.container.memoryLimitMiB,
      environment: {
        TZ: 'Asia/Tokyo',
        ENVIRONMENT: props.environment,
        DATABASE_URL: `${props.rds.masterUser.username}:${props.rds.masterUser.password}@${props.databaseCluster.clusterEndpoint.hostname}:${props.databaseCluster.clusterEndpoint.port}/${props.rds.defaultDatabaseName}?loc=Local&collation=utf8mb4_unicode_ci`
      }
    })
    const appPortMappings: PortMapping[] = props.backend.container.containerPorts.map(it => {
      return { containerPort: it }
    })
    container.addPortMappings(...appPortMappings)

    const ec2Service = new Ec2Service(this, 'Ec2Service', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: props.backend.cluster.ec2Service.desiredCount,
      serviceName: props.backend.cluster.serviceName
    })

    const addApplicationTargetsProps: AddApplicationTargetsProps = {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      healthCheck: { path: '/health' }
    }

    const httpListener = applicationLoadBalancer.addListener('PublicListenerHttp', {
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      open: true
    })
    const httpListenerTargetGroup = httpListener.addTargets(
      'PublicListenerHttpTargets',
      addApplicationTargetsProps
    )
    httpListenerTargetGroup.addTarget(ec2Service)
  }
}
