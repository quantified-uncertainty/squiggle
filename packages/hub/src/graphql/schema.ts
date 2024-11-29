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
import "../server/relative-values/actions/buildRelativeValuesCacheAction";
import "./mutations/cancelGroupInvite";
import "../server/relative-values/actions/clearRelativeValuesCacheAction";
import "./mutations/updateSquiggleSnippetModel";

import { builder } from "./builder";

export const schema = builder.toSchema();
