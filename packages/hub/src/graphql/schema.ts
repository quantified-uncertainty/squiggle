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
import "./mutations/deleteRelativeValuesDefinition";
import "./mutations/deleteModel";
import "./mutations/setUsername";
import "./mutations/updateModelSlug";
import "./mutations/updateRelativeValuesDefinition";
import "./mutations/updateSquiggleSnippetModel";
import "./mutations/buildRelativeValuesCache";

export const schema = builder.toSchema();
