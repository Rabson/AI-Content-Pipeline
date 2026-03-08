import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserModule } from '../user/user.module';
import { StorageController } from './storage.controller';
import { StorageRepository } from './storage.repository';
import { StorageSigningService } from './services/storage-signing.service';
import { StorageService } from './storage.service';

@Module({
  imports: [UserModule],
  controllers: [StorageController],
  providers: [PrismaService, StorageRepository, StorageService, StorageSigningService],
  exports: [StorageService, StorageRepository],
})
export class StorageModule {}
