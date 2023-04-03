// This module should never be imported on the frontend.
// This Next.js feature would force that, but doesn't work this CLI, unfortunately:
// import "server-only";

import fs from "fs";
import path from "path";

import { Model } from "@/model/utils";
import { Catalog, InterfaceWithModels } from "@/types";
import { allInterfaces } from "@models/src/index";
import { ModelEvaluator } from "./ModelEvaluator";
import { RelativeValueResult, CatalogCache, ModelCache } from "./types";

const cacheDir = path.join(path.dirname(__filename), "../../models/cache");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function modelToJson({
  catalog,
  model,
}: {
  catalog: Catalog;
  model: Model;
}): Promise<ModelCache["relativeValues"]> {
  let obj: Record<string, Record<string, RelativeValueResult>> = {};

  const modelResult = ModelEvaluator.create(model);
  if (!modelResult.ok) {
    console.error(`Failed to initialize a model: ${modelResult.value}`);
    return obj;
  }

  for (const start of catalog.items) {
    let row: Record<string, RelativeValueResult> = {};

    for (const end of catalog.items) {
      const relativeValue = modelResult.value.compareWithoutCache(
        start.id,
        end.id
      );
      if (!relativeValue.ok) {
        console.error(
          `Relative value returned a failure in model ${model.title}: ${relativeValue.value}. Comparing ${start.id} vs. ${end.id}`
        );
      }
      await sleep(0); //Used to make sure that it's possible to interrupt if wanted by console user.
      row[end.id] = relativeValue;
    }
    obj[start.id] = row;
  }
  return obj;
}

async function catalogToJson(catalog: InterfaceWithModels) {
  // Make sure the directory exists
  await fs.promises.mkdir(path.join(cacheDir, "interfaces"), {
    recursive: true,
  });

  let models: ModelCache[] = [];
  for (const [_, model] of catalog.models) {
    models.push({
      id: model.id,
      relativeValues: await modelToJson({
        catalog: catalog.catalog,
        model,
      }),
    });
  }
  const json: CatalogCache = {
    id: catalog.catalog.id,
    models,
  };

  fs.writeFileSync(
    path.join(cacheDir, `interfaces/${catalog.catalog.id}.json`),
    JSON.stringify(json, null, 2)
  );
  console.log(`Loaded ${catalog.catalog.title} to JSON`);
}

async function interfacesToJson() {
  for (const inter of allInterfaces) {
    await catalogToJson(inter);
  }
}

async function interfaceToJson(interfaceId: string) {
  const interface_ = allInterfaces.find((i) => i.catalog.id === interfaceId);
  if (interface_) {
    await catalogToJson(interface_);
  } else {
    console.error(`Could not find interface with ID ${interfaceId}`);
  }
}

async function readAndConcatJSONFiles() {
  try {
    const filenames = await fs.promises.readdir(
      path.join(cacheDir, "interfaces")
    );
    const jsonFiles = filenames.filter(
      (filename) => path.extname(filename) === ".json"
    );
    console.log("Opening filenames", jsonFiles);

    let items = [];
    for (const filename of jsonFiles) {
      try {
        const content = await fs.promises.readFile(
          path.join(cacheDir, `interfaces/${filename}`),
          "utf-8"
        );
        items.push(JSON.parse(content));
      } catch (err) {
        console.error("Error reading file", filename, err);
      }
    }

    await fs.promises.writeFile(
      path.join(cacheDir, "cache.json"),
      JSON.stringify(items, null, 2)
    );
  } catch (err) {
    console.error("Reading files didn't work", err);
  }
}

export async function buildCache({ interfaceId }: { interfaceId?: string }) {
  if (interfaceId) {
    await interfaceToJson(interfaceId);
  } else {
    await interfacesToJson();
  }
  await readAndConcatJSONFiles();
}
