import { ConsoleLogger, Injectable } from '@nestjs/common';
import { getTraceContext } from '../observability/opentelemetry';

@Injectable()
export class AppLogger extends ConsoleLogger {
  log(message: any, context?: string) {
    super.log(this.stringify('log', message, context), context);
  }

  error(message: any, trace?: string, context?: string) {
    super.error(this.stringify('error', message, context, trace), trace, context);
  }

  warn(message: any, context?: string) {
    super.warn(this.stringify('warn', message, context), context);
  }

  private stringify(
    level: string,
    message: unknown,
    context?: string,
    trace?: string,
  ): string {
    const traceContext = getTraceContext();

    return JSON.stringify({
      level,
      context,
      message,
      trace,
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      timestamp: new Date().toISOString(),
    });
  }
}
