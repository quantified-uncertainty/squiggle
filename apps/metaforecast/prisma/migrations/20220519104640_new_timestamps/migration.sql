-- questions
ALTER TABLE "questions"
  ADD COLUMN    "fetched" TIMESTAMP(6),
  ADD COLUMN    "first_seen" TIMESTAMP(6);

UPDATE "questions"
  SET "fetched" = "timestamp", "first_seen" = "timestamp";

ALTER TABLE "questions"
  ALTER COLUMN "fetched" SET NOT NULL,
  ALTER COLUMN "first_seen" SET NOT NULL;

-- history
ALTER TABLE "history"
  ADD COLUMN    "fetched" TIMESTAMP(6);

UPDATE "history" SET "fetched" = "timestamp";

ALTER TABLE "history"
  ALTER COLUMN "fetched" SET NOT NULL;

-- populate first_seen
UPDATE questions
  SET "first_seen" = h.fs
  FROM (
    SELECT id, MIN(fetched) AS fs FROM history GROUP BY id
  ) as h
  WHERE questions.id = h.id;
