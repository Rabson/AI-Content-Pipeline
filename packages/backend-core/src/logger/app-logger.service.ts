import { ConsoleLogger, Injectable } from '@nestjs/common';
import { context, trace } from '@opentelemetry/api';
import { redactSensitiveValues } from './redact.util';

@Injectable()
export class AppLogger extends ConsoleLogger {
  log(message: unknown, context?: string) {
    super.log(this.stringify('log', message, context), context);
  }

  error(message: unknown, traceMessage?: string, context?: string) {
    super.error(this.stringify('error', message, context, traceMessage), traceMessage, context);
  }

  warn(message: unknown, context?: string) {
    super.warn(this.stringify('warn', message, context), context);
  }

  private stringify(level: string, message: unknown, contextName?: string, traceMessage?: string) {
    const spanContext = trace.getSpan(context.active())?.spanContext();
    return JSON.stringify({
      level,
      context: contextName,
      message: redactSensitiveValues(message),
      trace: traceMessage,
      traceId: spanContext?.traceId ?? null,
      spanId: spanContext?.spanId ?? null,
      timestamp: new Date().toISOString(),
    });
  }
}
