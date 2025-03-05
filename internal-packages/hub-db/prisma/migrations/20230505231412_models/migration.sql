-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('SquiggleSnippet');

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelType" "ModelType" NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquiggleSnippet" (
    "id" TEXT NOT NULL,

    CONSTRAINT "SquiggleSnippet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "squiggleSnippet_modelId" FOREIGN KEY ("modelId") REFERENCES "SquiggleSnippet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
