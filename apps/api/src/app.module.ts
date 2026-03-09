import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TopicModule } from './modules/topic/topic.module';
import { ResearchModule } from './modules/research/research.module';
import { OutlineModule } from './modules/outline/outline.module';
import { DraftModule } from './modules/draft/draft.module';
import { RevisionModule } from './modules/revision/revision.module';
import { SystemModule } from './modules/system/system.module';
import { OpsModule } from './modules/ops/ops.module';
import { SeoModule } from './modules/seo/seo.module';
import { SocialModule } from './modules/social/social.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { PublisherModule } from './modules/publisher/publisher.module';
import { StorageModule } from './modules/storage/storage.module';
import { CommonModule } from './common/common.module';
import { env } from './config/env';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { UserModule } from './modules/user/user.module';
import { RequestContextMiddleware } from './common/request-context/request-context.middleware';

@Module({
  imports: [
    CommonModule,
    UserModule,
    BullModule.forRoot({
      connection: {
        url: env.redisUrl,
      },
      prefix: env.queuePrefix,
    }),
    WorkflowModule,
    TopicModule,
    ResearchModule,
    OutlineModule,
    DraftModule,
    RevisionModule,
    SystemModule,
    OpsModule,
    SeoModule,
    SocialModule,
    AnalyticsModule,
    DiscoveryModule,
    PublisherModule,
    StorageModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
