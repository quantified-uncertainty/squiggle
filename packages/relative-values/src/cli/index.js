import fs from "fs";
import { Command } from "@commander-js/extra-typings";
import open from "open";
import { sq, SqProject } from "@quri/squiggle-lang";
import { SqSampleSetDistribution } from "@quri/squiggle-lang/dist/src/public/SqDistribution";
import { getHealthInterventions } from "../builtins/health-interventions";
import { allInterfaces } from "@/builtins";
import { getModelCode, Model } from "@/model/utils";
import { modelFromJSON } from "@/model/utils";

const wrapper = sq`
{|x, y|
  dist = fn(x, y) -> SampleSet.fromDist
  {
    dist: dist,
    median: inv(dist, 0.5),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    db: 10 * (SampleSet.map(dist, abs) -> log10 -> stdev)
  }
}
`;

const buildRelativeValue = ({ fn, id1, id2 }) => {
  const result = fn.call([id1, id2]);
  if (!result.ok) {
    return { ok: false, value: result.value.toString() };
  }
  const record = result.value.asJS();
  if (!(record instanceof Map)) {
    return { ok: false, value: "Expected record" };
  }

  const dist = record.get("dist");
  const median = record.get("median");
  const min = record.get("min");
  const max = record.get("max");
  const db = record.get("db");

  if (!(dist instanceof SqSampleSetDistribution)) {
    // TODO - convert automatically?
    return { ok: false, value: "Expected sample set" };
  }

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
      dist,
      median,
      min,
      max,
      db,
    },
  };
};

const modelToJson = ({ catalog, model }) => {
  const project = SqProject.create();
  project.setSource("wrapper", wrapper);
  project.setContinues("wrapper", ["model"]);
  project.setSource("model", getModelCode(model));
  project.run("wrapper");
  const result = project.getResult("wrapper");
  let obj = {};
  for (const start of catalog.items) {
    let row = {};
    for (const end of catalog.items) {
      let relativeValue = buildRelativeValue({
        fn: result.value.value,
        id1: start.id,
        id2: end.id,
      });
      if (relativeValue.ok) {
        row[end.id] = {
          median: relativeValue.value.median,
          min: relativeValue.value.min,
          max: relativeValue.value.max,
          db: relativeValue.value.db,
        };
      }
    }
    obj[start.id] = row;
  }
  return obj
};

const catalogToJson = (catalog) => {
  let obj = {};
  for (const model of catalog.models){
    obj[model[1].title] = modelToJson({catalog:catalog.catalog, model: modelFromJSON(model[1])})
  }
  const json = ({
    id: catalog.catalog.id,
    caches: obj
  })
  fs.writeFileSync(`src/builtins_cache/${catalog.catalog.id}.json`, JSON.stringify(json));

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
    .action((filename, options) => {
      for (const inter of allInterfaces) {
        catalogToJson(inter)
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
