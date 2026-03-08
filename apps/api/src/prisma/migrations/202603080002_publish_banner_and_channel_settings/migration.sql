ALTER TABLE "Topic"
  ADD COLUMN "bannerImageStorageObjectId" TEXT,
  ADD COLUMN "bannerImageAlt" TEXT,
  ADD COLUMN "bannerImageCaption" TEXT;

ALTER TABLE "UserPublisherCredential"
  ADD COLUMN "settingsJson" JSONB;

CREATE INDEX "Topic_bannerImageStorageObjectId_idx" ON "Topic"("bannerImageStorageObjectId");

ALTER TABLE "Topic"
  ADD CONSTRAINT "Topic_bannerImageStorageObjectId_fkey"
  FOREIGN KEY ("bannerImageStorageObjectId") REFERENCES "StorageObject"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
