import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../api/src/prisma/prisma.service';

@Injectable()
export class DatabaseHealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }
}
