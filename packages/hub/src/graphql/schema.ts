import { builder } from "./builder";

import "./queries/relativeValuesDefinition";
import "./queries/relativeValuesDefinitions";
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
import "./mutations/clearRelativeValuesCache";

export const schema = builder.toSchema();
