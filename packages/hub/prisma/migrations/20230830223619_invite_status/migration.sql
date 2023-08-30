-- CreateEnum
CREATE TYPE "GroupInviteStatus" AS ENUM ('Pending', 'Accepted', 'Declined', 'Canceled');

-- DropIndex
DROP INDEX "GroupInvite_email_groupId_key";

-- DropIndex
DROP INDEX "GroupInvite_userId_groupId_key";

-- AlterTable
ALTER TABLE "GroupInvite" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" "GroupInviteStatus" NOT NULL DEFAULT 'Pending';
