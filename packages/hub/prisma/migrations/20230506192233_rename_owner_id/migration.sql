ALTER TABLE "Model" RENAME CONSTRAINT "Model_userId_fkey" to "Model_ownerId_fkey";
ALTER TABLE "Model" RENAME COLUMN "userId" to "ownerId";
