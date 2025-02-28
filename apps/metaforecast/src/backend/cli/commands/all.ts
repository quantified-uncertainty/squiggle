import { Command } from "@commander-js/extra-typings";

import { getPlatforms } from "@/backend/platformRegistry";
import { processPlatform } from "@/backend/platformUtils";
import { rebuildElasticDatabase } from "@/backend/utils/elastic";

import { tryCatchTryAgain } from "../utils";

export async function processAll() {
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("================================");
  console.log("STARTING UP");
  console.log("================================");
  console.log("");
  console.log("");
  console.log("");
  console.log("");

  for (const platform of getPlatforms({ withDailyFetcherOnly: true })) {
    console.log("");
    console.log("");
    console.log("****************************");
    console.log(platform.name);
    console.log("****************************");
    await tryCatchTryAgain(async () => await processPlatform(platform));
    console.log("****************************");
  }

  console.log("Rebuilding Elasticsearch database");
  await rebuildElasticDatabase();
}

export function addAllCommand(program: Command) {
  program
    .command("all")
    .description("process all platforms and rebuild elasticsearch database")
    .action(processAll);
}
