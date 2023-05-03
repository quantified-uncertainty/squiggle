-- CreateTable
CREATE TABLE "SquiggleCache" (
    "id" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "error" TEXT,
    "result" JSONB,
    "bindings" JSONB,

    CONSTRAINT "SquiggleCache_pkey" PRIMARY KEY ("id")
);
