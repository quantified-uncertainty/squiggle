// doesn't work this CLI, unfortunately:
// import "server-only";

import fs from "fs";
import path from "path";

import { getModelCode, Model, modelFromJSON } from "@/model/utils";
import { Catalog, InterfaceWithModels } from "@/types";
import { allInterfaces } from "@models/src/index";
import { sq, SqLambda, SqProject } from "@quri/squiggle-lang";
import { RelativeValueResult } from "../types";
import { CatalogCache, ModelCache } from "../cache";

const cacheDir = path.join(path.dirname(__filename), "../../../models/cache");

const wrapper = sq`
{|x, y|
  dist = fn(x, y) -> SampleSet.fromDist
  {
    median: inv(dist, 0.5),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    db: 10 * (SampleSet.map(dist, {|x| max([abs(x), 1e-9])}) -> log10 -> stdev)
  }
}
`;

function buildRelativeValue({
  fn,
  id1,
  id2,
}: {
  fn: SqLambda;
  id1: string;
  id2: string;
}): RelativeValueResult {
  const result = fn.call([id1, id2]);
  if (!result.ok) {
    return { ok: false, value: result.value.toString() };
  }
  const record = result.value.asJS();
  if (!(record instanceof Map)) {
    return { ok: false, value: "Expected record" };
  }

  const median = record.get("median");
  const min = record.get("min");
  const max = record.get("max");
  const db = record.get("db");

  if (typeof median !== "number") {
    return { ok: false, value: "Expected median to be a number" };
  }
  if (typeof min !== "number") {
    return { ok: false, value: "Expected min to be a number" };
  }
  if (typeof max !== "number") {
    return { ok: false, value: "Expected max to be a number" };
  }
  if (typeof db !== "number") {
    return { ok: false, value: "Expected db to be a number" };
  }

  return {
    ok: true,
    value: {
      median,
      min,
      max,
      db,
    },
  };
}

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
  const project = SqProject.create();
  project.setSource("wrapper", wrapper);
  project.setContinues("wrapper", ["model"]);
  project.setSource("model", getModelCode(model));

  project.run("wrapper");
  const result = project.getResult("wrapper");

  let obj: Record<string, Record<string, RelativeValueResult>> = {};
  if (result.ok && result.value.tag === "Lambda") {
    for (const start of catalog.items) {
      let row: Record<string, RelativeValueResult> = {};

      for (const end of catalog.items) {
        const relativeValue = buildRelativeValue({
          fn: result.value.value,
          id1: start.id,
          id2: end.id,
        });
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
        model: modelFromJSON(model),
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
