import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { closeHealthServer, registerHealthServer } from './support/health/health-server';
import { shutdownOpenTelemetry, startOpenTelemetry } from './support/opentelemetry';
import { WorkerHealthService } from './support/worker-health.service';
import { WorkerMetricsService } from './support/worker-metrics.service';

function attachShutdownHandlers(shutdown: () => Promise<void>) {
  process.once('SIGINT', () => {
    void shutdown();
  });

  process.once('SIGTERM', () => {
    void shutdown();
  });
}

async function bootstrap() {
  await startOpenTelemetry('worker');

  const app = await NestFactory.createApplicationContext(WorkerModule);
  const healthService = app.get(WorkerHealthService);
  const metricsService = app.get(WorkerMetricsService);
  const metricsPort = Number(process.env.WORKER_METRICS_PORT ?? 0);
  let healthServer = registerHealthServer(metricsPort, healthService, metricsService);

  const shutdown = async () => {
    await closeHealthServer(healthServer);
    healthServer = null;
    await app.close();
    await shutdownOpenTelemetry();
  };

  attachShutdownHandlers(shutdown);
}

void bootstrap().catch(async (error) => {
  console.error(error);
  await shutdownOpenTelemetry();
  process.exit(1);
});
