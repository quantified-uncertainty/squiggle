import crypto from "crypto";

import { Client as ElasticClient } from "@elastic/elasticsearch";
import { Question } from "@prisma/client";

import { prisma } from "../database/prisma";
import { platformNameToLabel } from "../platforms/registry";

let _CACHED_CLIENT: ElasticClient | null = null;
function getClient() {
  if (!_CACHED_CLIENT) {
    _CACHED_CLIENT = new ElasticClient({
      node: process.env.ELASTIC_HOST,
      auth: {
        username: process.env.ELASTIC_USER!,
        password: process.env.ELASTIC_PASSWORD!,
      },
    });
  }
  return _CACHED_CLIENT;
}

const ALIAS_NAME = process.env.ELASTIC_INDEX!;

export type ElasticQuestion = Omit<Question, "fetched" | "firstSeen"> & {
  fetched: string;
  firstSeen: string;
  optionsstringforsearch?: string;
  platformLabel: string;
  objectID: string;
};

function getoptionsstringforsearch(record: Question): string {
  let result = "";
  if (!!record.options && (record.options as any[]).length > 0) {
    result = (record.options as any[])
      .map((option: any) => option.name || null)
      .filter((x: any) => x != null)
      .join(", ");
  }
  return result;
}

export function questionToElasticDocument(question: Question): ElasticQuestion {
  return {
    ...question,
    fetched: question.fetched.toISOString(),
    firstSeen: question.firstSeen.toISOString(),
    platformLabel: platformNameToLabel(question.platform),
    objectID: question.id,
    optionsstringforsearch: getoptionsstringforsearch(question),
  };
}

export async function rebuildElasticDatabase() {
  const questions = await prisma.question.findMany();

  const oldIndexNames: string[] = [];
  if (await getClient().indices.existsAlias({ name: ALIAS_NAME })) {
    const alias = await getClient().indices.getAlias({ name: ALIAS_NAME });
    oldIndexNames.push(...Object.keys(alias));
  }

  const suffix = crypto.randomBytes(16).toString("hex");
  const index = `${ALIAS_NAME}-${suffix}`;

  console.log(`Creating a new index ${index}`);
  await getClient().indices.create({
    index,
    settings: {
      number_of_replicas: 0,
    },
  });

  let count = 0;
  let operations: { id: string; document: ElasticQuestion }[] = [];

  const flush = async () => {
    if (!operations.length) return;
    await getClient().bulk({
      operations: operations.flatMap((op) => [
        { index: { _index: index, _id: op.id } },
        op.document,
      ]),
    });
    count += operations.length;
    console.log(count);
    operations = [];
  };

  for (const question of questions) {
    operations.push({
      id: question.id,
      document: questionToElasticDocument(question),
    });
    if (operations.length >= 100) {
      await flush();
    }
  }
  await flush();
  console.log(`Pushed ${count} records to Elasticsearch.`);

  console.log("Switching alias to new index");
  await getClient().indices.updateAliases({
    body: {
      actions: [
        { remove: { index: "*", alias: ALIAS_NAME } },
        { add: { index, alias: ALIAS_NAME } },
      ],
    },
  });

  for (const oldIndexName of oldIndexNames) {
    console.log(`Removing old index ${oldIndexName}`);
    await getClient().indices.delete({ index: oldIndexName });
  }
}
