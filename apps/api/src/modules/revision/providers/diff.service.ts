import { Injectable } from '@nestjs/common';

@Injectable()
export class DiffService {
  buildUnifiedDiff(beforeMd: string, afterMd: string): string {
    if (beforeMd === afterMd) {
      return '--- before\n+++ after\n(no changes)';
    }

    return ['--- before', '+++ after', '- ' + beforeMd, '+ ' + afterMd].join('\n');
  }
}
