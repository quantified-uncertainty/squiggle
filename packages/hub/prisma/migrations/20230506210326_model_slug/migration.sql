ALTER TABLE "Model" ADD COLUMN "slug" TEXT;
UPDATE "Model" SET slug = id WHERE slug IS NULL;
ALTER TABLE "Model" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Model_slug_ownerId_key" ON "Model"("slug", "ownerId");
