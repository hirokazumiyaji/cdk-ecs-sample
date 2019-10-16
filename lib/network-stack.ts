import { Construct, Stack, StackProps, Tag, CfnResource, ConstructNode, IConstruct } from '@aws-cdk/core'
import { Context } from '../types/context'
import { CfnSubnet, Peer, Port, SecurityGroup, SubnetType, Vpc, SubnetNetworkAclAssociation } from '@aws-cdk/aws-ec2'

interface NetworkStackProps extends StackProps, Context {
}

export class NetworkStack extends Stack {
  public readonly vpc: Vpc
  public readonly ingressSecurityGroup: SecurityGroup
  public readonly backendSecurityGroup: SecurityGroup
  public readonly rdsSecurityGroup: SecurityGroup

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props)

    const vpc = new Vpc(
      this,
      'VPC',
      {
        cidr: props.network.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        maxAzs: props.network.maxAzs,
        natGateways: 0,
        subnetConfiguration: [
          {
            name: 'SubnetIngress',
            subnetType: SubnetType.PUBLIC,
            cidrMask: props.network.ingressSubnetCidrMask
          },
          {
            name: 'SubnetBackend',
            subnetType: SubnetType.PUBLIC,
            cidrMask: props.network.backendSubnetCidrMask
          },
          {
            name: 'SubnetRDS',
            subnetType: SubnetType.ISOLATED,
            cidrMask: props.network.rdsSubnetCidrMask
          }
        ]
      }
    )
    vpc.node.applyAspect(new Tag('Name', `${props.service} ${props.environment}`))
    vpc.node.applyAspect(new Tag('Service', props.service))
    vpc.node.applyAspect(new Tag('Environment', props.environment))
    vpc.selectSubnets({ subnetGroupName: 'SubnetIngress' }).subnets.forEach(it => {
      it.node.applyAspect(new Tag('Name', `${props.service} ${props.environment} ingress`))
    })
    vpc.selectSubnets({ subnetGroupName: 'SubnetBackend' }).subnets.forEach(it => {
      it.node.applyAspect(new Tag('Name', `${props.service} ${props.environment} backend`))
    })
    vpc.selectSubnets({ subnetGroupName: 'SubnetRDS' }).subnets.forEach(it => {
      it.node.applyAspect(new Tag('Name', `${props.service} ${props.environment} rds`))
    })

    const ingressSecurityGroup = new SecurityGroup(
      this,
      'SecurityGroupIngress',
      {
        allowAllOutbound: true,
        vpc: vpc
      }
    )
    const ingressPorts = [80, 443]
    ingressPorts.forEach(it => {
      ingressSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(it))
      ingressSecurityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(it))
    })
    ingressSecurityGroup.node.applyAspect(new Tag('Name', `${props.service} ${props.environment} ingress`))
    ingressSecurityGroup.node.applyAspect(new Tag('Service', props.service))
    ingressSecurityGroup.node.applyAspect(new Tag('Environment', props.environment))

    const backendSecurityGroup = new SecurityGroup(
      this,
      'SecurityGroupBackend',
      {
        allowAllOutbound: true,
        vpc: vpc
      }
    )
    vpc.selectSubnets({ subnetGroupName: 'SubnetIngress' })
      .subnets
      .map(it => it.node.defaultChild as CfnSubnet)
      .forEach(it => {
        backendSecurityGroup.addIngressRule(Peer.ipv4(it.cidrBlock), Port.allTcp())
        if (it.ipv6CidrBlock) {
          backendSecurityGroup.addIngressRule(Peer.ipv6(it.ipv6CidrBlock), Port.allTcp())
        }
      })
    backendSecurityGroup.node.applyAspect(new Tag('Name', `${props.service} ${props.environment} backend`))
    backendSecurityGroup.node.applyAspect(new Tag('Service', props.service))
    backendSecurityGroup.node.applyAspect(new Tag('Environment', props.environment))

    const rdsSecurityGroup = new SecurityGroup(
      this,
      'SecurityGroupRDS',
      {
        allowAllOutbound: true,
        vpc: vpc
      }
    )
    vpc.selectSubnets({ subnetGroupName: 'SubnetBackend' })
      .subnets
      .map(it => it.node.defaultChild as CfnSubnet)
      .forEach(it => {
        rdsSecurityGroup.addIngressRule(Peer.ipv4(it.cidrBlock), Port.tcp(3306))
        if (it.ipv6CidrBlock) {
          rdsSecurityGroup.addIngressRule(Peer.ipv6(it.ipv6CidrBlock), Port.tcp(3306))
        }
      })
    rdsSecurityGroup.node.applyAspect(new Tag('Name', `${props.service} ${props.environment} rds`))
    rdsSecurityGroup.node.applyAspect(new Tag('Service', props.service))
    rdsSecurityGroup.node.applyAspect(new Tag('Environment', props.environment))

    this.vpc = vpc
    this.ingressSecurityGroup = ingressSecurityGroup
    this.backendSecurityGroup = backendSecurityGroup
    this.rdsSecurityGroup = rdsSecurityGroup
  }
}
