import { InterfaceWithModels } from "@/types";
import { getQuriBuiltin } from "./quri";
import { getQuriSoftwareBuiltin } from "./quri-software";
import { getQuriPosts } from "./quri-posts";
import { getCrossCauses } from "./cross-cause";
import { getHealthInterventions } from "./health-interventions";
import { getThingsYouShouldBuy } from "./things-you-should-buy";
import { getMacrovariables } from "./macrovariables";

export const allInterfaces: InterfaceWithModels[] = [
  getQuriBuiltin(),
  getQuriSoftwareBuiltin(),
  getQuriPosts(),
  getCrossCauses(),
  getHealthInterventions(),
	getThingsYouShouldBuy(),
  getMacrovariables(),
];
