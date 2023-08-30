import { builder } from "./builder";

import "./errors/BaseError";
import "./errors/NotFoundError";

import "./queries/globalStatistics";
import "./queries/group";
import "./queries/groups";
import "./queries/me";
import "./queries/model";
import "./queries/models";
import "./queries/relativeValuesDefinition";
import "./queries/relativeValuesDefinitions";
import "./queries/runSquiggle";
import "./queries/userByUsername";
import "./queries/users";

import "./mutations/buildRelativeValuesCache";
import "./mutations/clearRelativeValuesCache";
import "./mutations/createGroup";
import "./mutations/createRelativeValuesDefinition";
import "./mutations/createSquiggleSnippetModel";
import "./mutations/deleteModel";
import "./mutations/deleteRelativeValuesDefinition";
import "./mutations/setUsername";
import "./mutations/updateModelPrivacy";
import "./mutations/updateModelSlug";
import "./mutations/updateRelativeValuesDefinition";
import "./mutations/updateSquiggleSnippetModel";
import "./mutations/updateMembershipRole";
import "./mutations/updateGroupInviteRole";
import "./mutations/inviteUserToGroup";
import "./mutations/cancelGroupInvite";

export const schema = builder.toSchema();
