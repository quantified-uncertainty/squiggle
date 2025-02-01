-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contents" JSONB NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "creator" TEXT NOT NULL,
    "extra" JSONB NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frontpage" (
    "id" SERIAL NOT NULL,
    "frontpage_full" JSONB NOT NULL,
    "frontpage_sliced" JSONB NOT NULL,

    CONSTRAINT "frontpage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "history" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "stars" INTEGER NOT NULL,
    "qualityindicators" JSONB NOT NULL,
    "extra" JSONB NOT NULL,
    "pk" SERIAL NOT NULL,

    CONSTRAINT "history_pkey" PRIMARY KEY ("pk")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "stars" INTEGER NOT NULL,
    "qualityindicators" JSONB NOT NULL,
    "extra" JSONB NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "history_id_idx" ON "history"("id");
