-- CreateIndex
CREATE INDEX "history_platform_idx" ON "history"("platform");

-- CreateIndex
CREATE INDEX "history_fetched_idx" ON "history"("fetched");

-- CreateIndex
CREATE INDEX "questions_platform_idx" ON "questions"("platform");

-- CreateIndex
CREATE INDEX "questions_fetched_idx" ON "questions"("fetched");

-- CreateIndex
CREATE INDEX "questions_first_seen_idx" ON "questions"("first_seen");
