import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class OutlineValidatorService {
  validateOutput(output: any): void {
    if (!output || typeof output !== 'object') {
      throw new BadRequestException('Invalid outline output');
    }

    if (!Array.isArray(output.sections) || output.sections.length === 0) {
      throw new BadRequestException('Outline must contain at least one section');
    }

    const keys = output.sections.map((s: any) => s.sectionKey);
    const unique = new Set(keys);
    if (unique.size !== keys.length) {
      throw new BadRequestException('Outline section keys must be unique');
    }
  }
}
