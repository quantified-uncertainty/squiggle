import "dotenv/config";

import crypto from "crypto";

import { prisma } from "@quri/metaforecast-db";

// This script counts the number of unique history entries in the database, to check how many duplicates there are.
// It's not used anywhere, but I'm keeping it here for now.
async function main() {
  let cursor = 0;
  let total = 0;
  const take = 1000;
  const uniq = new Set<string>();

  while (1) {
    const rows = await prisma.history.findMany({
      take,
      ...(cursor
        ? {
            skip: 1,
            cursor: { pk: cursor },
          }
        : {}),
    });

    total += rows.length;

    for (const { pk, fetched, ...row } of rows) {
      uniq.add(
        // hash the entire entry
        crypto.createHash("sha256").update(JSON.stringify(row)).digest("hex")
      );
    }
    console.log(`Total: ${total}, uniq: ${uniq.size}`);

    if (rows.length === take) {
      cursor = rows[rows.length - 1].pk;
    } else {
      break;
    }
  }
}

main();
