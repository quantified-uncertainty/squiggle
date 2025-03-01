// Saving data to Manifold-specific tables.

import fs from "fs/promises";
import { z } from "zod";

import { ManifoldMarket, prisma, Prisma } from "@quri/metaforecast-db";

import { fetchFullMarket, fetchGroup } from "./api";
import { fullMarketSchema, ManifoldApiFullMarket } from "./apiSchema";

const platformName = "manifold";

/**
 * Saves a full market from API to Manifold-specific tables and returns the Prisma market object.
 */
async function saveExtendedMarket(
  market: ManifoldApiFullMarket
): Promise<ManifoldMarket> {
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
      console.warn(`${slug} group not found`);
    }
  }

  return await prisma.$transaction<ManifoldMarket>(async (tx) => {
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
      include: {
        creator: true,
        answers: true,
        groups: {
          include: {
            group: true,
          },
        },
      },
    });

    // Upsert answers
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

    // TODO - re-select with some nested relations?
    return dbMarket;
  });
}

/**
 * Process full markets and save them to extended tables.
 * Returns Prisma market objects.
 */
export async function saveMarketsToExtendedTables(
  markets: ManifoldApiFullMarket[]
): Promise<ManifoldMarket[]> {
  const prismaMarkets: ManifoldMarket[] = [];

  for (const market of markets) {
    const prismaMarket = await saveExtendedMarket(market);
    prismaMarkets.push(prismaMarket);
  }

  return prismaMarkets;
}

/**
 * Imports markets from a JSON archive file and saves to extended tables.
 * Returns the saved Prisma market objects.
 */
export async function importMarketsFromJsonArchiveFile(
  filename: string
): Promise<ManifoldMarket[]> {
  console.log("Loading JSON archive");
  const file = await fs.readFile(filename, "utf8");
  console.log("Parsing JSON");
  const json = JSON.parse(file);
  console.log("Parsing with zod");

  const parsedArray = z.array(z.any()).parse(json);
  const fullMarkets: ManifoldApiFullMarket[] = [];

  // process each market in the JSON archive
  for (let i = 0; i < parsedArray.length; i++) {
    const market = parsedArray[i];
    console.log(
      `Processing market ${market.id} (${i + 1} / ${parsedArray.length})`
    );

    try {
      if (market.outcomeType === "QUADRATIC_FUNDING") {
        // quadratic funding markets are not available anymore
        continue;
      }

      if (!("url" in market)) {
        // archive markets can miss URL
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

      fullMarkets.push(parsed.data);
    } catch (e) {
      console.error(e);
      console.log("Retrying with API...");
      // if there's an error, try to fetch from API
      try {
        const fullMarket = await fetchFullMarket(market.id);
        fullMarkets.push(fullMarket);
      } catch (apiError) {
        console.error("Failed to fetch from API as well:", apiError);
      }
    }
  }

  // Save all markets to extended tables
  return await saveMarketsToExtendedTables(fullMarkets);
}

/**
 * Imports a single market by ID, fetches it from API and saves to extended tables.
 * Returns the Prisma market object.
 */
export async function importSingleMarket(id: string): Promise<ManifoldMarket> {
  const fullMarket = await fetchFullMarket(id);
  return await saveExtendedMarket(fullMarket);
}
