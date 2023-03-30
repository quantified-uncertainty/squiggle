import { InterfaceWithModels } from "@/types";
import { getQuriBuiltin } from "./quri";
import { getQuriSoftwareBuiltin } from "./quri-software";
import { getQuriPosts } from "./quri-posts";
import { getHealthInterventions } from "./health-interventions";
import { getThingsYouShouldBuy } from "./things-you-should-buy";

export const allInterfaces: InterfaceWithModels[] = [
  getQuriBuiltin(),
  getQuriSoftwareBuiltin(),
  getQuriPosts(),
  getHealthInterventions(),
	getThingsYouShouldBuy()
];
