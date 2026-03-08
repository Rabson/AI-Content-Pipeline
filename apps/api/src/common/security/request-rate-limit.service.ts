import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface Entry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RequestRateLimitService {
  private readonly entries = new Map<string, Entry>();

  enforce(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (current.count >= limit) {
      throw new HttpException('Too many requests for this operation', HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
  }
}
