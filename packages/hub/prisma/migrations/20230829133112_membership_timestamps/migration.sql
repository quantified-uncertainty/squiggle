ALTER TABLE
  "UserGroupMembership"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "UserGroupMembership" SET "updatedAt" = "createdAt";

ALTER TABLE
  "UserGroupMembership"
  ALTER COLUMN "updatedAt" SET NOT NULL;
