-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM (
  'AUTH_FAILURE',
  'LOGIN_FAILED',
  'LOGIN_SUCCEEDED',
  'ACCOUNT_LOCKED',
  'PUBLISH_REQUESTED',
  'ADMIN_PUBLISH_ON_BEHALF',
  'CREDENTIAL_UPSERTED',
  'CREDENTIAL_ROTATED',
  'CREDENTIAL_REENCRYPTED',
  'CREDENTIAL_REVOKED',
  'JOB_REPLAY_REQUESTED'
);

-- CreateEnum
CREATE TYPE "PublisherCredentialAuditAction" AS ENUM (
  'UPSERTED',
  'ROTATED',
  'REENCRYPTED',
  'REVOKED'
);

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "lastFailedLoginAt" TIMESTAMP(3),
  ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserPublisherCredential"
  ADD COLUMN "keyVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "UserPublisherCredentialAudit" (
  "id" TEXT NOT NULL,
  "credentialId" TEXT,
  "userId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "channel" "PublicationChannel" NOT NULL,
  "action" "PublisherCredentialAuditAction" NOT NULL,
  "encryptedToken" TEXT,
  "keyVersion" INTEGER NOT NULL,
  "tokenHint" TEXT,
  "settingsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserPublisherCredentialAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL,
  "eventType" "SecurityEventType" NOT NULL,
  "actorUserId" TEXT,
  "subjectUserId" TEXT,
  "subjectEmail" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "path" TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPublisherCredentialAudit_userId_channel_createdAt_idx"
  ON "UserPublisherCredentialAudit"("userId", "channel", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserPublisherCredentialAudit_actorUserId_createdAt_idx"
  ON "UserPublisherCredentialAudit"("actorUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SecurityEvent_eventType_createdAt_idx"
  ON "SecurityEvent"("eventType", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SecurityEvent_actorUserId_createdAt_idx"
  ON "SecurityEvent"("actorUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SecurityEvent_subjectUserId_createdAt_idx"
  ON "SecurityEvent"("subjectUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SecurityEvent_resourceType_resourceId_createdAt_idx"
  ON "SecurityEvent"("resourceType", "resourceId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "UserPublisherCredentialAudit"
  ADD CONSTRAINT "UserPublisherCredentialAudit_credentialId_fkey"
  FOREIGN KEY ("credentialId") REFERENCES "UserPublisherCredential"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPublisherCredentialAudit"
  ADD CONSTRAINT "UserPublisherCredentialAudit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPublisherCredentialAudit"
  ADD CONSTRAINT "UserPublisherCredentialAudit_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent"
  ADD CONSTRAINT "SecurityEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityEvent"
  ADD CONSTRAINT "SecurityEvent_subjectUserId_fkey"
  FOREIGN KEY ("subjectUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
