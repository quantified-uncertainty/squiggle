import { builder } from "../builder";

import "./queries/definition";
import "./queries/definitions";
import "./queries/me";
import "./queries/model";
import "./queries/models";
import "./queries/runSquiggle";
import "./queries/userByUsername";
import "./queries/users";

import "./mutations/createSquiggleSnippetModel";
import "./mutations/deleteModel";
import "./mutations/setUsername";
import "./mutations/updateSquiggleSnippetModel";
import "./mutations/createRelativeValuesDefinition";

export const schema = builder.toSchema();
