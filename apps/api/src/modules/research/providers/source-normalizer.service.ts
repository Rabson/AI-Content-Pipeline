import { Injectable } from '@nestjs/common';

@Injectable()
export class SourceNormalizerService {
  normalizeUrl(url: string): string {
    return url.trim();
  }

  extractDomain(url: string): string | null {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return null;
    }
  }
}
