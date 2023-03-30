import fs from "fs";
import path from "path";
import { Command } from "@commander-js/extra-typings";
import { sq, SqProject } from "@quri/squiggle-lang";
import { allInterfaces } from "@/../models/src/index";
import { getModelCode, Model } from "@/model/utils";
import { modelFromJSON } from "@/model/utils";
import { result, SqLambda } from "@quri/squiggle-lang";
import { Catalog, InterfaceWithModels, Item } from "@/types";

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

const buildRelativeValue = ({
  fn,
  id1,
  id2,
}: {
  fn: SqLambda;
  id1: string;
  id2: string;
}) => {
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
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const modelToJson = async ({
  catalog,
  model,
}: {
  catalog: Catalog;
  model: Model;
}) => {
  const project = SqProject.create();
  project.setSource("wrapper", wrapper);
  project.setContinues("wrapper", ["model"]);
  project.setSource("model", getModelCode(model));
  project.run("wrapper");
  const result = project.getResult("wrapper");
  if (result.ok && result.value.tag == "Lambda") {
    let obj: { [k: string]: any } = {};
    for (const start of catalog.items) {
      let row: { [k: string]: any } = {};
      for (const end of catalog.items) {
        let relativeValue = buildRelativeValue({
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
    return obj;
  }
};

const catalogToJson = async (catalog: InterfaceWithModels) => {
  // Make sure the directory exists
  await fs.promises.mkdir("models/cache/interfaces", { recursive: true });

  let models: any[] = [];
  for (const [_, model] of catalog.models) {
    models.push({
      id: model.id,
      relativeValues: await modelToJson({
        catalog: catalog.catalog,
        model: modelFromJSON(model),
      }),
    });
  }
  const json = {
    id: catalog.catalog.id,
    models,
  };
  fs.writeFileSync(
    `models/cache/interfaces/${catalog.catalog.id}.json`,
    JSON.stringify(json, null, 2)
  );
  console.log(`Loaded ${catalog.catalog.title} to JSON`);
};

const interfacesToJson = async () => {
  for (const inter of allInterfaces) {
    await catalogToJson(inter);
  }
};

const interfaceToJson = async (interfaceId: string) => {
  const interface_ = allInterfaces.find((i) => i.catalog.id === interfaceId);
  if (interface_) {
    await catalogToJson(interface_);
  } else {
    console.error(`Could not find interface with ID ${interfaceId}`);
  }
};

async function readAndConcatJSONFiles() {
  try {
    const filenames = await fs.promises.readdir("models/cache/interfaces/");
    const jsonFiles = filenames.filter(
      (filename) => path.extname(filename) === ".json"
    );
    console.log("Opening filenames", jsonFiles);

    let items = [];
    for (const filename of jsonFiles) {
      try {
        const content = await fs.promises.readFile(
          "models/cache/interfaces/" + filename,
          "utf-8"
        );
        items.push(JSON.parse(content));
      } catch (err) {
        console.error("Error reading file", filename, err);
      }
    }

    await fs.promises.writeFile(
      "models/cache/cache.json",
      JSON.stringify(items, null, 2)
    );
  } catch (err) {
    console.error("Reading files didn't work", err);
  }
}

export const makeProgram = () => {
  const program = new Command();

  program
    .command("cacheRV")
    .option("-i, --interface <interfaceName>", "Specify an interface id")
    .action(async (options) => {
      if (options.interface) {
        await interfaceToJson(options.interface);
        await readAndConcatJSONFiles();
      } else {
        await interfacesToJson();
        await readAndConcatJSONFiles();
      }
    });

  return program;
};

const main = async () => {
  await makeProgram().parseAsync();
};

if (require.main === module) {
  // running as script, https://stackoverflow.com/a/6398335
  main();
}
