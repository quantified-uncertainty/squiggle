ALTER TABLE "history" ADD COLUMN     "idref" TEXT;

ALTER TABLE "history" ADD CONSTRAINT "history_idref_fkey" FOREIGN KEY ("idref") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

UPDATE "history" SET idref = id WHERE id in (SELECT id FROM "questions");
