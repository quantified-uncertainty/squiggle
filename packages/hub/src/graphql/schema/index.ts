import { builder } from "../builder";

import "./queries/me";
import "./queries/model";
import "./queries/models";
import "./queries/runSquiggle";
import "./queries/userByUsername";
import "./queries/users";

import "./mutations/createSquiggleSnippetModel";
import "./mutations/updateSquiggleSnippetModel";
import "./mutations/updateModelSlug";
import "./mutations/setUsername";
import "./mutations/deleteModel";

export const schema = builder.toSchema();
