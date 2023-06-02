import { allInterfaces } from "./models/src/index.js";

/*
Temporary script for hub migration.
Invoke with `NAME=macrovariables tsx ./export-to-hub.ts`
*/

const name = process.env.NAME;

const int = allInterfaces.find((i) => i.catalog.id === name);

if (!int) {
  throw new Error("not found");
}

const { catalog } = int;

console.log(
  JSON.stringify(
    {
      items: catalog.items,
      clusters: Object.keys(catalog.clusters).map((key) => ({
        id: key,
        color: catalog.clusters[key].color,
        recommendedUnit: catalog.clusters[key].recommendedUnit,
      })),
      recommendedUnit: catalog.recommendedUnit,
    },
    null,
    2
  )
);
