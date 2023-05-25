import { builder } from "./builder";

import "./queries/definition";
import "./queries/definitions";
import "./queries/me";
import "./queries/model";
import "./queries/models";
import "./queries/runSquiggle";
import "./queries/userByUsername";
import "./queries/users";

import "./mutations/createRelativeValuesDefinition";
import "./mutations/createSquiggleSnippetModel";
import "./mutations/deleteDefinition";
import "./mutations/deleteModel";
import "./mutations/setUsername";
import "./mutations/updateModelSlug";
import "./mutations/updateRelativeValuesDefinition";
import "./mutations/updateSquiggleSnippetModel";

export const schema = builder.toSchema();
