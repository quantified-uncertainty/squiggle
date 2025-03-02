-- CreateEnum
CREATE TYPE "ManifoldToken" AS ENUM ('MANA', 'CASH');

-- CreateTable
CREATE TABLE "platform_state" (
    "platform" TEXT NOT NULL,
    "state" JSONB NOT NULL,

    CONSTRAINT "platform_state_pkey" PRIMARY KEY ("platform")
);

-- CreateTable
CREATE TABLE "ManifoldMarket" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3),
    "question" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "outcomeType" TEXT NOT NULL,
    "mechanism" TEXT NOT NULL,
    "probability" DOUBLE PRECISION,
    "pool" JSONB,
    "p" DOUBLE PRECISION,
    "totalLiquidity" DOUBLE PRECISION,
    "value" DOUBLE PRECISION,
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "isLogScale" BOOLEAN,
    "volume" DOUBLE PRECISION NOT NULL,
    "volume24Hours" DOUBLE PRECISION NOT NULL,
    "isResolved" BOOLEAN NOT NULL,
    "resolutionTime" TIMESTAMP(3),
    "resolution" TEXT,
    "resolutionProbability" DOUBLE PRECISION,
    "uniqueBettorCount" INTEGER NOT NULL,
    "lastUpdatedTime" TIMESTAMP(3),
    "lastBetTime" TIMESTAMP(3),
    "token" "ManifoldToken",
    "siblingContractId" TEXT,
    "shouldAnswersSumToOne" BOOLEAN,
    "addAnswersMode" TEXT,
    "options" JSONB NOT NULL,
    "totalBounty" DOUBLE PRECISION,
    "bountyLeft" DOUBLE PRECISION,
    "description" JSONB,
    "textDescription" TEXT NOT NULL,
    "coverImageUrl" TEXT,

    CONSTRAINT "ManifoldMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManifoldMarketUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,

    CONSTRAINT "ManifoldMarketUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManifoldMarketAnswer" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "createdTime" TIMESTAMP(3) NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "pool" JSONB,

    CONSTRAINT "ManifoldMarketAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManifoldGroup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ManifoldGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManifoldMarketGroup" (
    "marketId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ManifoldGroup_slug_key" ON "ManifoldGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ManifoldMarketGroup_marketId_groupId_key" ON "ManifoldMarketGroup"("marketId", "groupId");

-- AddForeignKey
ALTER TABLE "ManifoldMarket" ADD CONSTRAINT "ManifoldMarket_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "ManifoldMarketUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManifoldMarketAnswer" ADD CONSTRAINT "ManifoldMarketAnswer_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "ManifoldMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManifoldMarketGroup" ADD CONSTRAINT "ManifoldMarketGroup_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "ManifoldMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManifoldMarketGroup" ADD CONSTRAINT "ManifoldMarketGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ManifoldGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
