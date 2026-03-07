import { BadRequestException, Injectable } from '@nestjs/common';
import { RESEARCH_MIN_SOURCES } from '../constants/research.constants';

@Injectable()
export class ResearchValidatorService {
  validateSources(sourceCount: number): void {
    if (sourceCount < RESEARCH_MIN_SOURCES) {
      throw new BadRequestException(`At least ${RESEARCH_MIN_SOURCES} sources are required`);
    }
  }

  validateStructuredOutput(output: any): void {
    if (!output || typeof output !== 'object') {
      throw new BadRequestException('Research output is not a valid object');
    }

    const required = ['summary', 'keyPoints', 'examples', 'sources', 'confidenceScore'];
    for (const key of required) {
      if (!(key in output)) {
        throw new BadRequestException(`Missing required field: ${key}`);
      }
    }
  }
}
