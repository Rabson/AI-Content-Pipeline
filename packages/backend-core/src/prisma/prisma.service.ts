import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { readOptional } from '@aicp/shared-config/env/readers';

function readDatabaseUrl(): string {
  const databaseUrl = readOptional('DATABASE_URL');
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for Prisma');
  }
  return databaseUrl;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: readDatabaseUrl(),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
