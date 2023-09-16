/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type BaseError = Error & {
  __typename?: 'BaseError';
  message: Scalars['String']['output'];
};

export type BuildRelativeValuesCacheResult = {
  __typename?: 'BuildRelativeValuesCacheResult';
  relativeValuesExport: RelativeValuesExport;
};

export type CancelGroupInviteResult = {
  __typename?: 'CancelGroupInviteResult';
  invite: GroupInvite;
};

export type ClearRelativeValuesCacheResult = {
  __typename?: 'ClearRelativeValuesCacheResult';
  relativeValuesExport: RelativeValuesExport;
};

export type CreateGroupResult = {
  __typename?: 'CreateGroupResult';
  group: Group;
};

export type CreateRelativeValuesDefinitionResult = {
  __typename?: 'CreateRelativeValuesDefinitionResult';
  definition: RelativeValuesDefinition;
};

export type CreateSquiggleSnippetModelResult = {
  __typename?: 'CreateSquiggleSnippetModelResult';
  model: Model;
};

export type DefinitionRefInput = {
  owner: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type DeleteMembershipResult = {
  __typename?: 'DeleteMembershipResult';
  ok: Scalars['Boolean']['output'];
};

export type DeleteModelResult = {
  __typename?: 'DeleteModelResult';
  ok: Scalars['Boolean']['output'];
};

export type DeleteRelativeValuesDefinitionResult = {
  __typename?: 'DeleteRelativeValuesDefinitionResult';
  ok: Scalars['Boolean']['output'];
};

export type EmailGroupInvite = GroupInvite & Node & {
  __typename?: 'EmailGroupInvite';
  email: Scalars['String']['output'];
  group: Group;
  id: Scalars['ID']['output'];
  role: MembershipRole;
};

export type Error = {
  message: Scalars['String']['output'];
};

export type GlobalStatistics = {
  __typename?: 'GlobalStatistics';
  models: Scalars['Int']['output'];
  relativeValuesDefinitions: Scalars['Int']['output'];
  users: Scalars['Int']['output'];
};

export type Group = Node & Owner & {
  __typename?: 'Group';
  createdAtTimestamp: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  inviteForMe?: Maybe<GroupInvite>;
  invites?: Maybe<GroupInviteConnection>;
  memberships: UserGroupMembershipConnection;
  models: ModelConnection;
  myMembership?: Maybe<UserGroupMembership>;
  slug: Scalars['String']['output'];
  updatedAtTimestamp: Scalars['Float']['output'];
};


export type GroupInvitesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type GroupMembershipsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type GroupModelsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type GroupInvite = {
  group: Group;
  id: Scalars['ID']['output'];
  role: MembershipRole;
};

export type GroupInviteConnection = {
  __typename?: 'GroupInviteConnection';
  edges: Array<GroupInviteEdge>;
  pageInfo: PageInfo;
};

export type GroupInviteEdge = {
  __typename?: 'GroupInviteEdge';
  cursor: Scalars['String']['output'];
  node: GroupInvite;
};

export enum GroupInviteReaction {
  Accept = 'Accept',
  Decline = 'Decline'
}

export type GroupsQueryInput = {
  /** List only groups that you're a member of */
  myOnly?: InputMaybe<Scalars['Boolean']['input']>;
  slugContains?: InputMaybe<Scalars['String']['input']>;
};

export type InviteUserToGroupResult = {
  __typename?: 'InviteUserToGroupResult';
  invite: GroupInvite;
};

export type Me = {
  __typename?: 'Me';
  asUser: User;
  email: Scalars['String']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export enum MembershipRole {
  Admin = 'Admin',
  Member = 'Member'
}

export type Model = Node & {
  __typename?: 'Model';
  createdAtTimestamp: Scalars['Float']['output'];
  currentRevision: ModelRevision;
  id: Scalars['ID']['output'];
  isEditable: Scalars['Boolean']['output'];
  isPrivate: Scalars['Boolean']['output'];
  owner: Owner;
  revision: ModelRevision;
  revisions: ModelRevisionConnection;
  slug: Scalars['String']['output'];
  updatedAtTimestamp: Scalars['Float']['output'];
};


export type ModelRevisionArgs = {
  id: Scalars['ID']['input'];
};


export type ModelRevisionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ModelConnection = {
  __typename?: 'ModelConnection';
  edges: Array<ModelEdge>;
  pageInfo: PageInfo;
};

export type ModelContent = SquiggleSnippet;

export type ModelEdge = {
  __typename?: 'ModelEdge';
  cursor: Scalars['String']['output'];
  node: Model;
};

export type ModelRevision = Node & {
  __typename?: 'ModelRevision';
  content: ModelContent;
  createdAtTimestamp: Scalars['Float']['output'];
  forRelativeValues?: Maybe<RelativeValuesExport>;
  id: Scalars['ID']['output'];
  model: Model;
  relativeValuesExports: Array<RelativeValuesExport>;
};


export type ModelRevisionForRelativeValuesArgs = {
  input?: InputMaybe<ModelRevisionForRelativeValuesInput>;
};

export type ModelRevisionConnection = {
  __typename?: 'ModelRevisionConnection';
  edges: Array<ModelRevisionEdge>;
  pageInfo: PageInfo;
};

export type ModelRevisionEdge = {
  __typename?: 'ModelRevisionEdge';
  cursor: Scalars['String']['output'];
  node: ModelRevision;
};

export type ModelRevisionForRelativeValuesInput = {
  for?: InputMaybe<ModelRevisionForRelativeValuesSlugOwnerInput>;
  variableName: Scalars['String']['input'];
};

export type ModelRevisionForRelativeValuesSlugOwnerInput = {
  owner: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type MoveModelResult = {
  __typename?: 'MoveModelResult';
  model: Model;
};

export type Mutation = {
  __typename?: 'Mutation';
  buildRelativeValuesCache: MutationBuildRelativeValuesCacheResult;
  cancelGroupInvite: MutationCancelGroupInviteResult;
  clearRelativeValuesCache: MutationClearRelativeValuesCacheResult;
  createGroup: MutationCreateGroupResult;
  createRelativeValuesDefinition: MutationCreateRelativeValuesDefinitionResult;
  createSquiggleSnippetModel: MutationCreateSquiggleSnippetModelResult;
  deleteMembership: MutationDeleteMembershipResult;
  deleteModel: MutationDeleteModelResult;
  deleteRelativeValuesDefinition: MutationDeleteRelativeValuesDefinitionResult;
  inviteUserToGroup: MutationInviteUserToGroupResult;
  moveModel: MutationMoveModelResult;
  reactToGroupInvite: MutationReactToGroupInviteResult;
  setUsername: MutationSetUsernameResult;
  updateGroupInviteRole: MutationUpdateGroupInviteRoleResult;
  updateMembershipRole: MutationUpdateMembershipRoleResult;
  updateModelPrivacy: MutationUpdateModelPrivacyResult;
  updateModelSlug: MutationUpdateModelSlugResult;
  updateRelativeValuesDefinition: MutationUpdateRelativeValuesDefinitionResult;
  updateSquiggleSnippetModel: MutationUpdateSquiggleSnippetModelResult;
};


export type MutationBuildRelativeValuesCacheArgs = {
  input: MutationBuildRelativeValuesCacheInput;
};


export type MutationCancelGroupInviteArgs = {
  input: MutationCancelGroupInviteInput;
};


export type MutationClearRelativeValuesCacheArgs = {
  input: MutationClearRelativeValuesCacheInput;
};


export type MutationCreateGroupArgs = {
  input: MutationCreateGroupInput;
};


export type MutationCreateRelativeValuesDefinitionArgs = {
  input: MutationCreateRelativeValuesDefinitionInput;
};


export type MutationCreateSquiggleSnippetModelArgs = {
  input: MutationCreateSquiggleSnippetModelInput;
};


export type MutationDeleteMembershipArgs = {
  input: MutationDeleteMembershipInput;
};


export type MutationDeleteModelArgs = {
  input: MutationDeleteModelInput;
};


export type MutationDeleteRelativeValuesDefinitionArgs = {
  input: MutationDeleteRelativeValuesDefinitionInput;
};


export type MutationInviteUserToGroupArgs = {
  input: MutationInviteUserToGroupInput;
};


export type MutationMoveModelArgs = {
  input: MutationMoveModelInput;
};


export type MutationReactToGroupInviteArgs = {
  input: MutationReactToGroupInviteInput;
};


export type MutationSetUsernameArgs = {
  username: Scalars['String']['input'];
};


export type MutationUpdateGroupInviteRoleArgs = {
  input: MutationUpdateGroupInviteRoleInput;
};


export type MutationUpdateMembershipRoleArgs = {
  input: MutationUpdateMembershipRoleInput;
};


export type MutationUpdateModelPrivacyArgs = {
  input: MutationUpdateModelPrivacyInput;
};


export type MutationUpdateModelSlugArgs = {
  input: MutationUpdateModelSlugInput;
};


export type MutationUpdateRelativeValuesDefinitionArgs = {
  input: MutationUpdateRelativeValuesDefinitionInput;
};


export type MutationUpdateSquiggleSnippetModelArgs = {
  input: MutationUpdateSquiggleSnippetModelInput;
};

export type MutationBuildRelativeValuesCacheInput = {
  exportId: Scalars['String']['input'];
};

export type MutationBuildRelativeValuesCacheResult = BaseError | BuildRelativeValuesCacheResult;

export type MutationCancelGroupInviteInput = {
  inviteId: Scalars['String']['input'];
};

export type MutationCancelGroupInviteResult = BaseError | CancelGroupInviteResult;

export type MutationClearRelativeValuesCacheInput = {
  exportId: Scalars['String']['input'];
};

export type MutationClearRelativeValuesCacheResult = BaseError | ClearRelativeValuesCacheResult;

export type MutationCreateGroupInput = {
  slug: Scalars['String']['input'];
};

export type MutationCreateGroupResult = BaseError | CreateGroupResult;

export type MutationCreateRelativeValuesDefinitionInput = {
  clusters: Array<RelativeValuesClusterInput>;
  /** Optional, if not set, definition will be created on current user's account */
  groupSlug?: InputMaybe<Scalars['String']['input']>;
  items: Array<RelativeValuesItemInput>;
  recommendedUnit?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type MutationCreateRelativeValuesDefinitionResult = BaseError | CreateRelativeValuesDefinitionResult | ValidationError;

export type MutationCreateSquiggleSnippetModelInput = {
  /** Squiggle source code */
  code: Scalars['String']['input'];
  /** Optional, if not set, model will be created on current user's account */
  groupSlug?: InputMaybe<Scalars['String']['input']>;
  /** Defaults to false */
  isPrivate?: InputMaybe<Scalars['Boolean']['input']>;
  slug: Scalars['String']['input'];
};

export type MutationCreateSquiggleSnippetModelResult = BaseError | CreateSquiggleSnippetModelResult | ValidationError;

export type MutationDeleteMembershipInput = {
  group: Scalars['String']['input'];
  user: Scalars['String']['input'];
};

export type MutationDeleteMembershipResult = BaseError | DeleteMembershipResult;

export type MutationDeleteModelInput = {
  owner: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type MutationDeleteModelResult = BaseError | DeleteModelResult | NotFoundError | ValidationError;

export type MutationDeleteRelativeValuesDefinitionInput = {
  owner: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type MutationDeleteRelativeValuesDefinitionResult = BaseError | DeleteRelativeValuesDefinitionResult;

export type MutationInviteUserToGroupInput = {
  group: Scalars['String']['input'];
  role: MembershipRole;
  username: Scalars['String']['input'];
};

export type MutationInviteUserToGroupResult = BaseError | InviteUserToGroupResult | ValidationError;

export type MutationMoveModelInput = {
  newOwner: Scalars['String']['input'];
  oldOwner: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type MutationMoveModelResult = BaseError | MoveModelResult | NotFoundError | ValidationError;

export type MutationReactToGroupInviteInput = {
  action: GroupInviteReaction;
  inviteId: Scalars['String']['input'];
};

export type MutationReactToGroupInviteResult = BaseError | ReactToGroupInviteResult;

export type MutationSetUsernameResult = BaseError | Me | ValidationError;

export type MutationUpdateGroupInviteRoleInput = {
  inviteId: Scalars['String']['input'];
  role: MembershipRole;
};

export type MutationUpdateGroupInviteRoleResult = BaseError | UpdateGroupInviteRoleResult;

export type MutationUpdateMembershipRoleInput = {
  group: Scalars['String']['input'];
  role: MembershipRole;
  user: Scalars['String']['input'];
};

export type MutationUpdateMembershipRoleResult = BaseError | UpdateMembershipRoleResult;

export type MutationUpdateModelPrivacyInput = {
  isPrivate: Scalars['Boolean']['input'];
  owner: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type MutationUpdateModelPrivacyResult = BaseError | UpdateModelPrivacyResult;

export type MutationUpdateModelSlugInput = {
  newSlug: Scalars['String']['input'];
  oldSlug: Scalars['String']['input'];
  owner: Scalars['String']['input'];
};

export type MutationUpdateModelSlugResult = BaseError | UpdateModelSlugResult;

export type MutationUpdateRelativeValuesDefinitionInput = {
  clusters: Array<RelativeValuesClusterInput>;
  items: Array<RelativeValuesItemInput>;
  owner: Scalars['String']['input'];
  recommendedUnit?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type MutationUpdateRelativeValuesDefinitionResult = BaseError | UpdateRelativeValuesDefinitionResult;

export type MutationUpdateSquiggleSnippetModelInput = {
  /** @deprecated Use content arg instead */
  code?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<SquiggleSnippetContentInput>;
  owner: Scalars['String']['input'];
  relativeValuesExports?: InputMaybe<Array<RelativeValuesExportInput>>;
  slug: Scalars['String']['input'];
};

export type MutationUpdateSquiggleSnippetModelResult = BaseError | UpdateSquiggleSnippetResult;

export type Node = {
  id: Scalars['ID']['output'];
};

export type NotFoundError = Error & {
  __typename?: 'NotFoundError';
  message: Scalars['String']['output'];
};

export type Owner = {
  id: Scalars['ID']['output'];
  slug: Scalars['String']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  globalStatistics: GlobalStatistics;
  group: QueryGroupResult;
  groups: QueryGroupsConnection;
  me: Me;
  model: QueryModelResult;
  models: ModelConnection;
  node?: Maybe<Node>;
  nodes: Array<Maybe<Node>>;
  relativeValuesDefinition: QueryRelativeValuesDefinitionResult;
  relativeValuesDefinitions: RelativeValuesDefinitionConnection;
  runSquiggle: SquiggleOutput;
  userByUsername: QueryUserByUsernameResult;
  users: QueryUsersConnection;
};


export type QueryGroupArgs = {
  slug: Scalars['String']['input'];
};


export type QueryGroupsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  input?: InputMaybe<GroupsQueryInput>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryModelArgs = {
  input: QueryModelInput;
};


export type QueryModelsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNodesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type QueryRelativeValuesDefinitionArgs = {
  input: QueryRelativeValuesDefinitionInput;
};


export type QueryRelativeValuesDefinitionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  input?: InputMaybe<RelativeValuesDefinitionsQueryInput>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRunSquiggleArgs = {
  code: Scalars['String']['input'];
};


export type QueryUserByUsernameArgs = {
  username: Scalars['String']['input'];
};


export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  input?: InputMaybe<UsersQueryInput>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryGroupResult = BaseError | Group | NotFoundError;

export type QueryGroupsConnection = {
  __typename?: 'QueryGroupsConnection';
  edges: Array<QueryGroupsConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryGroupsConnectionEdge = {
  __typename?: 'QueryGroupsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Group;
};

export type QueryModelInput = {
  owner: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type QueryModelResult = BaseError | Model | NotFoundError;

export type QueryRelativeValuesDefinitionInput = {
  owner: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type QueryRelativeValuesDefinitionResult = BaseError | NotFoundError | RelativeValuesDefinition;

export type QueryUserByUsernameResult = BaseError | NotFoundError | User;

export type QueryUsersConnection = {
  __typename?: 'QueryUsersConnection';
  edges: Array<QueryUsersConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryUsersConnectionEdge = {
  __typename?: 'QueryUsersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type ReactToGroupInviteResult = {
  __typename?: 'ReactToGroupInviteResult';
  invite: GroupInvite;
  membership?: Maybe<UserGroupMembership>;
};

export type RelativeValuesCluster = {
  __typename?: 'RelativeValuesCluster';
  color: Scalars['String']['output'];
  id: Scalars['String']['output'];
  recommendedUnit?: Maybe<Scalars['String']['output']>;
};

export type RelativeValuesClusterInput = {
  color: Scalars['String']['input'];
  id: Scalars['String']['input'];
  recommendedUnit?: InputMaybe<Scalars['String']['input']>;
};

export type RelativeValuesDefinition = Node & {
  __typename?: 'RelativeValuesDefinition';
  createdAtTimestamp: Scalars['Float']['output'];
  currentRevision: RelativeValuesDefinitionRevision;
  id: Scalars['ID']['output'];
  isEditable: Scalars['Boolean']['output'];
  modelExports: Array<RelativeValuesExport>;
  owner: Owner;
  slug: Scalars['String']['output'];
  updatedAtTimestamp: Scalars['Float']['output'];
};

export type RelativeValuesDefinitionConnection = {
  __typename?: 'RelativeValuesDefinitionConnection';
  edges: Array<RelativeValuesDefinitionEdge>;
  pageInfo: PageInfo;
};

export type RelativeValuesDefinitionEdge = {
  __typename?: 'RelativeValuesDefinitionEdge';
  cursor: Scalars['String']['output'];
  node: RelativeValuesDefinition;
};

export type RelativeValuesDefinitionRevision = Node & {
  __typename?: 'RelativeValuesDefinitionRevision';
  clusters: Array<RelativeValuesCluster>;
  id: Scalars['ID']['output'];
  items: Array<RelativeValuesItem>;
  recommendedUnit?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export type RelativeValuesDefinitionsQueryInput = {
  owner?: InputMaybe<Scalars['String']['input']>;
  slugContains?: InputMaybe<Scalars['String']['input']>;
};

export type RelativeValuesExport = Node & {
  __typename?: 'RelativeValuesExport';
  cache: Array<RelativeValuesPairCache>;
  definition: RelativeValuesDefinition;
  id: Scalars['ID']['output'];
  modelRevision: ModelRevision;
  variableName: Scalars['String']['output'];
};

export type RelativeValuesExportInput = {
  definition: DefinitionRefInput;
  variableName: Scalars['String']['input'];
};

export type RelativeValuesItem = {
  __typename?: 'RelativeValuesItem';
  clusterId?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type RelativeValuesItemInput = {
  clusterId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type RelativeValuesPairCache = Node & {
  __typename?: 'RelativeValuesPairCache';
  errorString?: Maybe<Scalars['String']['output']>;
  firstItem: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  resultJSON: Scalars['String']['output'];
  secondItem: Scalars['String']['output'];
};

export type SquiggleErrorOutput = SquiggleOutput & {
  __typename?: 'SquiggleErrorOutput';
  errorString: Scalars['String']['output'];
  isCached: Scalars['Boolean']['output'];
};

export type SquiggleOkOutput = SquiggleOutput & {
  __typename?: 'SquiggleOkOutput';
  bindingsJSON: Scalars['String']['output'];
  isCached: Scalars['Boolean']['output'];
  resultJSON: Scalars['String']['output'];
};

export type SquiggleOutput = {
  isCached: Scalars['Boolean']['output'];
};

export type SquiggleSnippet = Node & {
  __typename?: 'SquiggleSnippet';
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type SquiggleSnippetContentInput = {
  code: Scalars['String']['input'];
};

export type UpdateGroupInviteRoleResult = {
  __typename?: 'UpdateGroupInviteRoleResult';
  invite: GroupInvite;
};

export type UpdateMembershipRoleResult = {
  __typename?: 'UpdateMembershipRoleResult';
  membership: UserGroupMembership;
};

export type UpdateModelPrivacyResult = {
  __typename?: 'UpdateModelPrivacyResult';
  model: Model;
};

export type UpdateModelSlugResult = {
  __typename?: 'UpdateModelSlugResult';
  model: Model;
};

export type UpdateRelativeValuesDefinitionResult = {
  __typename?: 'UpdateRelativeValuesDefinitionResult';
  definition: RelativeValuesDefinition;
};

export type UpdateSquiggleSnippetResult = {
  __typename?: 'UpdateSquiggleSnippetResult';
  model: Model;
};

export type User = Node & Owner & {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  models: ModelConnection;
  relativeValuesDefinitions: RelativeValuesDefinitionConnection;
  slug: Scalars['String']['output'];
  username: Scalars['String']['output'];
};


export type UserModelsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type UserRelativeValuesDefinitionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type UserGroupInvite = GroupInvite & Node & {
  __typename?: 'UserGroupInvite';
  group: Group;
  id: Scalars['ID']['output'];
  role: MembershipRole;
  user: User;
};

export type UserGroupMembership = Node & {
  __typename?: 'UserGroupMembership';
  id: Scalars['ID']['output'];
  role: MembershipRole;
  user: User;
};

export type UserGroupMembershipConnection = {
  __typename?: 'UserGroupMembershipConnection';
  edges: Array<UserGroupMembershipEdge>;
  pageInfo: PageInfo;
};

export type UserGroupMembershipEdge = {
  __typename?: 'UserGroupMembershipEdge';
  cursor: Scalars['String']['output'];
  node: UserGroupMembership;
};

export type UsersQueryInput = {
  usernameContains?: InputMaybe<Scalars['String']['input']>;
};

export type ValidationError = Error & {
  __typename?: 'ValidationError';
  issues: Array<ValidationErrorIssue>;
  message: Scalars['String']['output'];
};

export type ValidationErrorIssue = {
  __typename?: 'ValidationErrorIssue';
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type Test_MyMembershipQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type Test_MyMembershipQuery = { __typename?: 'Query', result: { __typename: 'BaseError' } | { __typename: 'Group', id: string, myMembership?: { __typename?: 'UserGroupMembership', id: string, role: MembershipRole } | null } | { __typename: 'NotFoundError' } };

export type Test_MembershipsQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type Test_MembershipsQuery = { __typename?: 'Query', result: { __typename: 'BaseError' } | { __typename: 'Group', id: string, memberships: { __typename?: 'UserGroupMembershipConnection', edges: Array<{ __typename?: 'UserGroupMembershipEdge', node: { __typename?: 'UserGroupMembership', id: string, role: MembershipRole, user: { __typename?: 'User', slug: string } } }> } } | { __typename: 'NotFoundError' } };

export type Test_CreateGroupMutationVariables = Exact<{
  input: MutationCreateGroupInput;
}>;


export type Test_CreateGroupMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'CreateGroupResult', group: { __typename?: 'Group', id: string } } };

export type Test_CreateModelMutationVariables = Exact<{
  input: MutationCreateSquiggleSnippetModelInput;
}>;


export type Test_CreateModelMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'CreateSquiggleSnippetModelResult', model: { __typename?: 'Model', id: string } } | { __typename: 'ValidationError', message: string } };

export type Test_InviteMutationVariables = Exact<{
  input: MutationInviteUserToGroupInput;
}>;


export type Test_InviteMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'InviteUserToGroupResult', invite: { __typename?: 'EmailGroupInvite', id: string } | { __typename?: 'UserGroupInvite', id: string } } | { __typename: 'ValidationError' } };

export type Test_AcceptInviteMutationVariables = Exact<{
  input: MutationReactToGroupInviteInput;
}>;


export type Test_AcceptInviteMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'ReactToGroupInviteResult' } };

export type CreateGroupTestMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateGroupTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'CreateGroupResult', group: { __typename?: 'Group', id: string, slug: string, memberships: { __typename?: 'UserGroupMembershipConnection', edges: Array<{ __typename?: 'UserGroupMembershipEdge', node: { __typename?: 'UserGroupMembership', role: MembershipRole, user: { __typename?: 'User', username: string } } }> } } } };

export type CreateSquiggleSnippetModelTestMutationVariables = Exact<{
  input: MutationCreateSquiggleSnippetModelInput;
}>;


export type CreateSquiggleSnippetModelTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'CreateSquiggleSnippetModelResult', model: { __typename?: 'Model', id: string, slug: string, isPrivate: boolean, owner: { __typename: 'Group', slug: string } | { __typename: 'User', slug: string } } } | { __typename: 'ValidationError', message: string, issues: Array<{ __typename?: 'ValidationErrorIssue', message: string }> } };

export type DeleteMembershipTestMutationVariables = Exact<{
  group: Scalars['String']['input'];
  user: Scalars['String']['input'];
}>;


export type DeleteMembershipTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'DeleteMembershipResult', ok: boolean } };

export type DeleteModelTestMutationVariables = Exact<{
  input: MutationDeleteModelInput;
}>;


export type DeleteModelTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'DeleteModelResult', ok: boolean } | { __typename: 'NotFoundError', message: string } | { __typename: 'ValidationError', message: string } };

export type InviteTestMutationVariables = Exact<{
  input: MutationInviteUserToGroupInput;
}>;


export type InviteTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'InviteUserToGroupResult', invite: { __typename?: 'EmailGroupInvite', id: string, role: MembershipRole } | { __typename?: 'UserGroupInvite', id: string, role: MembershipRole } } | { __typename: 'ValidationError' } };

export type SetUsernameTestMutationVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type SetUsernameTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'Me', email: string, username?: string | null } | { __typename: 'ValidationError', message: string } };

export type TestGroupsQueryVariables = Exact<{
  input: GroupsQueryInput;
}>;


export type TestGroupsQuery = { __typename?: 'Query', result: { __typename: 'QueryGroupsConnection', edges: Array<{ __typename?: 'QueryGroupsConnectionEdge', node: { __typename?: 'Group', id: string, slug: string } }> } };

export type TestMeQueryVariables = Exact<{ [key: string]: never; }>;


export type TestMeQuery = { __typename?: 'Query', me: { __typename: 'Me', email: string, username?: string | null } };

export type TestModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type TestModelsQuery = { __typename?: 'Query', models: { __typename?: 'ModelConnection', edges: Array<{ __typename?: 'ModelEdge', node: { __typename?: 'Model', slug: string, isEditable: boolean, isPrivate: boolean, owner: { __typename: 'Group', slug: string } | { __typename: 'User', slug: string } } }> } };

export type TestModels_CreateModelMutationVariables = Exact<{
  input: MutationCreateSquiggleSnippetModelInput;
}>;


export type TestModels_CreateModelMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError' } | { __typename: 'CreateSquiggleSnippetModelResult' } | { __typename: 'ValidationError' } };

export type TestUserByUsernameQueryVariables = Exact<{
  username: Scalars['String']['input'];
}>;


export type TestUserByUsernameQuery = { __typename?: 'Query', result: { __typename: 'BaseError', message: string } | { __typename: 'NotFoundError', message: string } | { __typename: 'User', slug: string, username: string } };

export type TestUsersQueryVariables = Exact<{
  input?: InputMaybe<UsersQueryInput>;
}>;


export type TestUsersQuery = { __typename?: 'Query', result: { __typename?: 'QueryUsersConnection', edges: Array<{ __typename?: 'QueryUsersConnectionEdge', node: { __typename?: 'User', username: string } }> } };


export const Test_MyMembershipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Test_MyMembership"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"group"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"myMembership"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]}}]} as unknown as DocumentNode<Test_MyMembershipQuery, Test_MyMembershipQueryVariables>;
export const Test_MembershipsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Test_Memberships"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"group"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<Test_MembershipsQuery, Test_MembershipsQueryVariables>;
export const Test_CreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Test_CreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MutationCreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<Test_CreateGroupMutation, Test_CreateGroupMutationVariables>;
export const Test_CreateModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Test_CreateModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MutationCreateSquiggleSnippetModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createSquiggleSnippetModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSquiggleSnippetModelResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<Test_CreateModelMutation, Test_CreateModelMutationVariables>;
export const Test_InviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Test_Invite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MutationInviteUserToGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"inviteUserToGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"InviteUserToGroupResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invite"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<Test_InviteMutation, Test_InviteMutationVariables>;
export const Test_AcceptInviteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Test_AcceptInvite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MutationReactToGroupInviteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"reactToGroupInvite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReactToGroupInviteResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]}}]} as unknown as DocumentNode<Test_AcceptInviteMutation, Test_AcceptInviteMutationVariables>;
export const CreateGroupTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGroupTest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"slug"},"value":{"kind":"StringValue","value":"testgroup","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<CreateGroupTestMutation, CreateGroupTestMutationVariables>;
export const CreateSquiggleSnippetModelTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSquiggleSnippetModelTest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MutationCreateSquiggleSnippetModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createSquiggleSnippetModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ValidationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"issues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSquiggleSnippetModelResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"model"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isPrivate"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreateSquiggleSnippetModelTestMutation, CreateSquiggleSnippetModelTestMutationVariables>;
export const DeleteMembershipTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMembershipTest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"group"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"user"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"deleteMembership"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"group"},"value":{"kind":"Variable","name":{"kind":"Name","value":"group"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"user"},"value":{"kind":"Variable","name":{"kind":"Name","value":"user"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteMembershipResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteMembershipTestMutation, DeleteMembershipTestMutationVariables>;
export const DeleteModelTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteModelTest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MutationDeleteModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"deleteModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotFoundError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteModelResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteModelTestMutation, DeleteModelTestMutationVariables>;
export const InviteTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteTest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MutationInviteUserToGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"inviteUserToGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"InviteUserToGroupResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invite"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]}}]} as unknown as DocumentNode<InviteTestMutation, InviteTestMutationVariables>;
export const SetUsernameTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetUsernameTest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"setUsername"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ValidationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Me"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]}}]} as unknown as DocumentNode<SetUsernameTestMutation, SetUsernameTestMutationVariables>;
export const TestGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GroupsQueryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"groups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TestGroupsQuery, TestGroupsQueryVariables>;
export const TestMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]} as unknown as DocumentNode<TestMeQuery, TestMeQueryVariables>;
export const TestModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"models"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"isEditable"}},{"kind":"Field","name":{"kind":"Name","value":"isPrivate"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<TestModelsQuery, TestModelsQueryVariables>;
export const TestModels_CreateModelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestModels_createModel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MutationCreateSquiggleSnippetModelInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createSquiggleSnippetModel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]} as unknown as DocumentNode<TestModels_CreateModelMutation, TestModels_CreateModelMutationVariables>;
export const TestUserByUsernameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestUserByUsername"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"userByUsername"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Error"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<TestUserByUsernameQuery, TestUserByUsernameQueryVariables>;
export const TestUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UsersQueryInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TestUsersQuery, TestUsersQueryVariables>;