import { InterfaceWithModels } from "@/types";
import { getQuriBuiltin } from "./quri";
import { getQuriSoftwareBuiltin } from "./quri-software";
import { getQuriPosts } from "./quri-posts";
import { getCrossCauses } from "./cross-cause";

export const allInterfaces: InterfaceWithModels[] = [
  getQuriBuiltin(),
  getQuriSoftwareBuiltin(),
  getQuriPosts(),
  getCrossCauses()
];
