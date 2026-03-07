import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';
import { AppLogger } from './common/logger/app-logger.service';
import { shutdownOpenTelemetry, startOpenTelemetry } from './common/observability/opentelemetry';

async function bootstrap() {
  await startOpenTelemetry('api');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(AppLogger));

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = env.port;
  await app.listen(port, '0.0.0.0');

  const shutdown = async () => {
    await app.close();
    await shutdownOpenTelemetry();
  };

  process.once('SIGINT', () => {
    void shutdown();
  });

  process.once('SIGTERM', () => {
    void shutdown();
  });
}

void bootstrap().catch(async (error) => {
  console.error(error);
  await shutdownOpenTelemetry();
  process.exit(1);
});
