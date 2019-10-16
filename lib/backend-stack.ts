import { Construct, Stack, StackProps, Tag } from '@aws-cdk/core'
import { Context } from '../types/context';

interface BackendStackProps extends StackProps, Context {
}

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)
  }
}
