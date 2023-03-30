import fs from "fs";
import path from "path";
import { Command } from "@commander-js/extra-typings";
import { sq, SqProject } from "@quri/squiggle-lang";
import {
  SqSampleSetDistribution,
  SqPointSetDistribution,
} from "@quri/squiggle-lang/dist/src/public/SqDistribution";
import { allInterfaces } from "@/builtins";
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
    db: 10 * (SampleSet.map(dist, abs) -> log10 -> stdev)
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

const modelToJson = ({
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
        row[end.id] = relativeValue;
      }
      obj[start.id] = row;
    }
    return obj;
  }
};

const catalogToJson = (catalog: InterfaceWithModels) => {
  let models: any[] = [];
  for (const [_, model] of catalog.models) {
    models.push({
      name: model.title,
      relativeValues: modelToJson({
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
    `src/builtins_cache/${catalog.catalog.id}.json`,
    JSON.stringify(json)
  );
};

async function readAndConcatJSONFiles() {
  try {
    const filenames = await fs.promises.readdir("src/builtins_cache/");
    const jsonFiles = filenames.filter(
      (filename) => path.extname(filename) === ".json"
    );
    console.log("Opening filenames", jsonFiles);

    let items = [];
    for (const filename of jsonFiles) {
      try {
        const content = await fs.promises.readFile(
          "src/builtins_cache/" + filename,
          "utf-8"
        );
        console.log("Loaded", filename);
        items.push(JSON.parse(content));
      } catch (err) {
        console.error("Error reading file", filename, err);
      }
    }

    await fs.promises.writeFile(
      "src/relative_value_cache.json",
      JSON.stringify(items)
    );
  } catch (err) {
    console.error("Reading files didn't work", err);
  }
}

export const makeProgram = () => {
  const program = new Command();

  program
    .command("run")
    .arguments("[filename]")
    .option(
      "-e, --eval <code>",
      "run a given squiggle code string instead of a file"
    )
    .action(async (filename, options) => {
      for (const inter of allInterfaces) {
        catalogToJson(inter);
        console.log(`Loaded ${inter.catalog.title} to JSON`);
      }
      await readAndConcatJSONFiles();
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
