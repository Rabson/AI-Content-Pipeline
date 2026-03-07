import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class DraftValidatorService {
  validateSectionKeys(sectionKeys: string[]): void {
    const unique = new Set(sectionKeys);
    if (unique.size !== sectionKeys.length) {
      throw new BadRequestException('Duplicate section keys detected in outline sections');
    }
  }

  validateMarkdown(markdown: string): void {
    if (!markdown.trim()) {
      throw new BadRequestException('Generated section markdown is empty');
    }
  }
}
