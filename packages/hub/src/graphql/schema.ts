import "./errors/BaseError";
import "./errors/NotFoundError";
import "./errors/ValidationError";
import "./queries/group";
import "./queries/model";
import "./queries/variable";
import "./queries/relativeValuesDefinition";
import "./queries/relativeValuesDefinitions";
import "./queries/userByUsername";
import "./mutations/adminUpdateModelVersion";
import "../server/search/actions/adminRebuildSearchIndexAction";
import "./mutations/buildRelativeValuesCache";
import "./mutations/cancelGroupInvite";
import "./mutations/clearRelativeValuesCache";
import "./mutations/updateSquiggleSnippetModel";

import { builder } from "./builder";

export const schema = builder.toSchema();
