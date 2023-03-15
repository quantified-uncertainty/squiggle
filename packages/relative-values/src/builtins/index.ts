import { InterfaceWithModels } from "@/types";
import { getQuriBuiltin } from "./quri";
import { getQuriSoftwareBuiltin } from "./quri-software";

export const allInterfaces: InterfaceWithModels[] = [
  getQuriBuiltin(),
  getQuriSoftwareBuiltin(),
];
