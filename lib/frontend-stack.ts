import { Construct, Stack, StackProps, Tag } from '@aws-cdk/core'
import { Bucket, BucketAccessControl } from '@aws-cdk/aws-s3'
import { CloudFrontWebDistribution, OriginProtocolPolicy } from '@aws-cdk/aws-cloudfront'
import { Context } from '../types/context'

interface FrontendStackProps extends StackProps, Context {
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props)

    const bucket = new Bucket(
      this,
      'Bucket',
      {
          bucketName: props.frontend.bucketName,
          websiteIndexDocument: 'index.html',
          accessControl: BucketAccessControl.PUBLIC_READ,
          publicReadAccess: true
      }
    )
    bucket.node.applyAspect(new Tag('Name', `${props.service} ${props.environment} web`))
    bucket.node.applyAspect(new Tag('Service', props.service))
    bucket.node.applyAspect(new Tag('Environment', props.environment))

    const cloudFrontWebDistribution = new CloudFrontWebDistribution(
      this,
      'CloudFrontWebDistribution',
      {
        originConfigs: [
            {
              customOriginSource: {
                domainName: bucket.bucketWebsiteDomainName,
                originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY
              },
              behaviors: [
                { isDefaultBehavior: true }
              ]
            }
          ]
      }
    )
    cloudFrontWebDistribution.node.applyAspect(new Tag('Name', `${props.service} ${props.environment}`))
    cloudFrontWebDistribution.node.applyAspect(new Tag('Service', props.service))
    cloudFrontWebDistribution.node.applyAspect(new Tag('Environment', props.environment))
  }
}
