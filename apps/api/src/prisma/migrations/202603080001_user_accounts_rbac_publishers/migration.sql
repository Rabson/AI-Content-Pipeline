-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'REVIEWER', 'USER');

-- AlterEnum
ALTER TYPE "PublicationChannel" ADD VALUE 'MEDIUM';
ALTER TYPE "PublicationChannel" ADD VALUE 'LINKEDIN';

-- AlterTable
ALTER TABLE "Publication" ADD COLUMN "publisherUserId" TEXT;
ALTER TABLE "Publication" ADD COLUMN "requestedByUserId" TEXT;

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN "ownerUserId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPublisherCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "PublicationChannel" NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "tokenHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPublisherCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_createdAt_idx" ON "User"("role", "isActive", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "UserPublisherCredential_channel_updatedAt_idx" ON "UserPublisherCredential"("channel", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserPublisherCredential_userId_channel_key" ON "UserPublisherCredential"("userId", "channel");

-- CreateIndex
CREATE INDEX "Publication_publisherUserId_createdAt_idx" ON "Publication"("publisherUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Topic_ownerUserId_updatedAt_idx" ON "Topic"("ownerUserId", "updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPublisherCredential" ADD CONSTRAINT "UserPublisherCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_publisherUserId_fkey" FOREIGN KEY ("publisherUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
