import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http';
import { WorkerHealthService } from '../worker-health.service';
import { WorkerMetricsService } from '../worker-metrics.service';

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

async function handleHealthRequest(
  request: IncomingMessage,
  response: ServerResponse,
  healthService: WorkerHealthService,
  metricsService: WorkerMetricsService,
) {
  if (request.url === '/health') {
    sendJson(response, 200, await healthService.health());
    return;
  }

  if (request.url === '/ready') {
    const payload = await healthService.readiness();
    sendJson(response, payload.ready ? 200 : 503, payload);
    return;
  }

  if (request.url === '/metrics') {
    sendJson(response, 200, metricsService.snapshot());
    return;
  }

  sendJson(response, 404, { error: 'not_found' });
}

export function registerHealthServer(
  metricsPort: number,
  healthService: WorkerHealthService,
  metricsService: WorkerMetricsService,
) {
  if (metricsPort <= 0) {
    return null;
  }

  const server = createServer((request, response) => {
    void handleHealthRequest(request, response, healthService, metricsService).catch((error) => {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : 'worker_health_check_failed',
      });
    });
  });

  server.listen(metricsPort);
  return server;
}

export async function closeHealthServer(server: Server | null) {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
