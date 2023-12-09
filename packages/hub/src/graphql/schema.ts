import { builder } from "./builder";

import "./errors/BaseError";
import "./errors/NotFoundError";
import "./errors/ValidationError";

import "./queries/globalStatistics";
import "./queries/group";
import "./queries/groups";
import "./queries/me";
import "./queries/model";
import "./queries/models";
import "./queries/modelsByVersion";
import "./queries/relativeValuesDefinition";
import "./queries/relativeValuesDefinitions";
import "./queries/runSquiggle";
import "./queries/search";
import "./queries/userByUsername";
import "./queries/users";

import "./mutations/acceptReusableGroupInviteToken";
import "./mutations/adminUpdateModelVersion";
import "./mutations/adminRebuildSearchIndex";
import "./mutations/buildRelativeValuesCache";
import "./mutations/cancelGroupInvite";
import "./mutations/clearRelativeValuesCache";
import "./mutations/createGroup";
import "./mutations/createRelativeValuesDefinition";
import "./mutations/createReusableGroupInviteToken";
import "./mutations/createSquiggleSnippetModel";
import "./mutations/deleteMembership";
import "./mutations/deleteModel";
import "./mutations/deleteRelativeValuesDefinition";
import "./mutations/deleteReusableGroupInviteToken";
import "./mutations/inviteUserToGroup";
import "./mutations/moveModel";
import "./mutations/reactToGroupInvite";
import "./mutations/setUsername";
import "./mutations/updateGroupInviteRole";
import "./mutations/updateMembershipRole";
import "./mutations/updateModelPrivacy";
import "./mutations/updateModelSlug";
import "./mutations/updateRelativeValuesDefinition";
import "./mutations/updateSquiggleSnippetModel";
import "./mutations/validateReusableGroupInviteToken";

export const schema = builder.toSchema();
