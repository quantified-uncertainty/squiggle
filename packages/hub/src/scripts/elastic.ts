import { PrismaClient } from "@prisma/client";

import { client } from "@/lib/elasticSearch";

// console.log("Elasticsearch client created", client);

const INDEX_NAME = "squiggleitems";

const prisma = new PrismaClient();

export async function rebuildElasticDatabase() {
  if (!(await client.indices.exists({ index: INDEX_NAME }))) {
    console.log("Creating an index");
    await client.indices.create({ index: INDEX_NAME });
  } else {
    console.log("Index exists");
  }

  const models = await prisma.model.findMany({
    include: {
      owner: true,
      currentRevision: {
        include: {
          squiggleSnippet: true,
        },
      },
    },
    take: 2,
  });
  models.forEach(async (model) => {
    const document = {
      type: "model",
      id: model.id,
      slug: model.slug,
      owner: model.owner.slug,
      code: model.currentRevision?.squiggleSnippet?.code,
    };
    await client.index({
      index: INDEX_NAME,
      document: document,
    });
  });
}

async function searchElasticDatabase(query: string) {
  const result = await client.search({
    index: INDEX_NAME,
    query: { match_all: {} },
  });
  console.log("Search result", result.hits.hits);
}
// console.log("Search result", result);

const foo = searchElasticDatabase("");

// rebuildElasticDatabase();
