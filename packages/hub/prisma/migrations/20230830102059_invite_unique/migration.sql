/*
  Warnings:

  - A unique constraint covering the columns `[userId,groupId]` on the table `GroupInvite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,groupId]` on the table `GroupInvite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GroupInvite_userId_groupId_key" ON "GroupInvite"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvite_email_groupId_key" ON "GroupInvite"("email", "groupId");
