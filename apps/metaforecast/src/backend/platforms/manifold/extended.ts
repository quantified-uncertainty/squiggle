// Saving data to Manifold-specific tables.

import { Prisma } from "@prisma/client";
import fs from "fs/promises";
import { z } from "zod";

import { prisma } from "@/backend/database/prisma";

import { fetchAllMarketsLite, fetchFullMarket, fetchGroup } from "./api";
import { fullMarketSchema, ManifoldFullMarket } from "./apiSchema";

async function saveMarket(market: ManifoldFullMarket) {
  const {
    // extracted to separate User table
    creatorUsername,
    creatorName,
    creatorAvatarUrl,
    // other tables
    answers = [],
    groupSlugs = [],
    ...data
  } = market;

  const creator = await prisma.manifoldMarketUser.upsert({
    where: {
      id: data.creatorId,
    },
    update: {
      name: creatorName,
      username: creatorUsername,
      avatarUrl: creatorAvatarUrl,
    },
    create: {
      id: data.creatorId,
      name: creatorName,
      username: creatorUsername,
      avatarUrl: creatorAvatarUrl,
    },
  });

  const existingGroups = await prisma.manifoldGroup.findMany({
    where: {
      slug: {
        in: groupSlugs,
      },
    },
  });
  const groupIds = existingGroups.map((g) => g.id);

  // Look for non-existing groups, fetch them and create them
  const groupsToCreate = groupSlugs.filter(
    (slug) => !existingGroups.some((g) => g.slug === slug)
  );

  for (const slug of groupsToCreate) {
    try {
      const group = await fetchGroup(slug);
      const dbGroup = await prisma.manifoldGroup.create({
        data: {
          id: group.id,
          slug: group.slug,
          name: group.name,
        },
      });
      groupIds.push(dbGroup.id);
    } catch {
      // not fatal - some old markets can have invalid group slugs
      // example: https://api.manifold.markets/v0/market/uT1j2SWhZuiaA0myti9q, https://manifold.markets/Austin/will-at-least-75-of-the-usa-covid19
      // slug `covid` exists in API, but doesn't exist on the website
      console.warn(`${slug} group not found`);
    }
  }

  await prisma.$transaction(async (tx) => {
    const dbMarket = await tx.manifoldMarket.upsert({
      where: {
        id: data.id,
      },
      update: {
        ...data,
        creatorId: creator.id,
      },
      create: {
        ...data,
        options: data.options ?? Prisma.JsonNull,
        creatorId: creator.id,
      },
    });

    // Upsert answers
    // TODO - can old answers disappear?
    for (const answer of answers) {
      await tx.manifoldMarketAnswer.upsert({
        where: {
          id: answer.id,
        },
        update: {
          ...answer,
          marketId: dbMarket.id,
        },
        create: {
          ...answer,
          marketId: dbMarket.id,
        },
      });
    }

    // Update group slugs
    {
      const existingRelations = await tx.manifoldMarketGroup.findMany({
        where: {
          marketId: dbMarket.id,
        },
      });
      const existingGroupIds = existingRelations.map((r) => r.groupId);

      const relationsToCreate = groupIds.filter(
        (id) => !existingGroupIds.includes(id)
      );
      const relationsToDelete = existingGroupIds.filter(
        (id) => !groupIds.includes(id)
      );

      await tx.manifoldMarketGroup.createMany({
        data: relationsToCreate.map((groupId) => ({
          marketId: dbMarket.id,
          groupId: groupId,
        })),
      });

      await tx.manifoldMarketGroup.deleteMany({
        where: {
          marketId: dbMarket.id,
          groupId: {
            in: relationsToDelete,
          },
        },
      });
    }
  });
}

// unused
async function importAllMarketsToExtendedDb() {
  const allMarketsLite = await fetchAllMarketsLite();
  allMarketsLite.map(async (market) => {
    const fullMarket = await fetchFullMarket(market.id);
    await saveMarket(fullMarket);
  });
}

// exposed as manifold-extended cli command
export async function importMarketsFromJsonArchiveFile(filename: string) {
  console.log("Loading JSON archive");
  const file = await fs.readFile(filename, "utf8");
  console.log("Parsing JSON");
  const json = JSON.parse(file);
  console.log("Parsing with zod");

  const parsedArray = z.array(z.any()).parse(json);

  // patch legacy data
  for (let i = 0; i < parsedArray.length; i++) {
    const market = parsedArray[i];
    console.log(
      `Saving market ${market.id} (${i + 1} / ${parsedArray.length})`
    );

    try {
      if (market.outcomeType === "QUADRATIC_FUNDING") {
        // quadratic funding markets are not available anymore, e.g. see https://manifold.markets/FranklinBaldo/best-markets-of-the-week-contest-20
        continue;
      }

      if (!("url" in market)) {
        // archive markets can miss URL; I don't want to make url optional in the schema because it's not optional in the API
        market.url = `https://manifold.markets/${market.creatorUsername}/${market.slug}`;
      }

      if ("answers" in market) {
        // upgrade legacy format
        for (const answer of market.answers) {
          if (!answer.probability) {
            answer.probability = answer.prob;
          }
          if (answer.poolYes && answer.poolNo) {
            answer.pool = {
              YES: answer.poolYes,
              NO: answer.poolNo,
            };
          }
        }
      }

      const parsed = fullMarketSchema.safeParse(market);
      if (!parsed.success) {
        console.log(JSON.stringify(parsed.error.issues, null, 2));
        console.log(market);
        throw new Error(
          "JSON validation failed for market " + (market as any).id
        );
      }

      await saveMarket(parsed.data);
    } catch (e) {
      console.error(e);
      console.log("Retrying with API...");
      // maybe the broken market? let's refetch it from API and try again
      await importSingleMarket(market.id);
    }
  }
}

// exposed as manifold-one cli command
export async function importSingleMarket(id: string) {
  const fullMarket = await fetchFullMarket(id);
  await saveMarket(fullMarket);
}
