import fs from "fs/promises";

async function printManualScores() {
  const manualScoresText = await fs.readFile(
    "./data/manual-scores.json",
    "utf-8"
  );
  const manualScores = JSON.parse(manualScoresText);

  const weights = {
    surprise: 0.4,
    relevance: 0.2,
    robustness: 0.2,
    quality: 0.2,
  } as Record<string, number>;

  for (const [key, entry] of Object.entries(manualScores)) {
    let score = 0;
    for (const [topic, values] of Object.entries(entry as any)) {
      const avg =
        (values as number[]).reduce((a, b) => a + b, 0) / values.length;
      score += avg * weights[topic];
    }
    console.log(key.padEnd(45), score);
  }
}

async function main() {
  await printManualScores();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
