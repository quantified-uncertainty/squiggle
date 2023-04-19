import { InterfaceWithModels } from "@/types";
import * as quri from "./quri";
import * as software from "./quri-software";
import * as posts from "./quri-posts";
import * as health from "./health-interventions";
import * as macrovariables from "./macrovariables";
import * as purchases from "./things-you-should-buy";
import { Map } from "immutable";

const items = [
  { catalog: quri.catalog, models: quri.models },
  { catalog: macrovariables.catalog, models: macrovariables.models },
];

export const allInterfaces: InterfaceWithModels[] = items.map(
  ({ catalog, models }) => ({
    catalog,
    models: Map(models.map((m) => [m.id, m])),
  })
);
