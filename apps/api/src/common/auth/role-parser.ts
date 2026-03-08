import { UnauthorizedException } from '@nestjs/common';
import { AppRole } from './roles.enum';

export function parseAppRole(input: string): AppRole {
  if (input === AppRole.ADMIN) {
    return AppRole.ADMIN;
  }
  if (input === AppRole.REVIEWER) {
    return AppRole.REVIEWER;
  }
  if (input === AppRole.EDITOR) {
    return AppRole.EDITOR;
  }
  if (input === AppRole.USER) {
    return AppRole.USER;
  }

  throw new UnauthorizedException('Invalid actor role');
}
