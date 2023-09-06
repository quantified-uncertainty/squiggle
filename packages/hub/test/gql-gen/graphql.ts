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

export type CreateSquiggleSnippetResult = {
  __typename?: 'CreateSquiggleSnippetResult';
  model: Model;
};

export type DefinitionRefInput = {
  slug: Scalars['String']['input'];
  username: Scalars['String']['input'];
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

export type Group = Node & {
  __typename?: 'Group';
  createdAtTimestamp: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  inviteForMe?: Maybe<GroupInvite>;
  invites?: Maybe<GroupInviteConnection>;
  memberships: UserGroupMembershipConnection;
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

export type GroupConnection = {
  __typename?: 'GroupConnection';
  edges: Array<GroupEdge>;
  pageInfo: PageInfo;
};

export type GroupEdge = {
  __typename?: 'GroupEdge';
  cursor: Scalars['String']['output'];
  node: Group;
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

export type InviteUserToGroupResult = {
  __typename?: 'InviteUserToGroupResult';
  invite: GroupInvite;
};

export type Me = {
  __typename?: 'Me';
  email?: Maybe<Scalars['String']['output']>;
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
  isPrivate: Scalars['Boolean']['output'];
  owner: User;
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
  for?: InputMaybe<ModelRevisionForRelativeValuesSlugUsernameInput>;
  variableName: Scalars['String']['input'];
};

export type ModelRevisionForRelativeValuesSlugUsernameInput = {
  slug: Scalars['String']['input'];
  username: Scalars['String']['input'];
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
  items: Array<RelativeValuesItemInput>;
  recommendedUnit?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type MutationCreateRelativeValuesDefinitionResult = BaseError | CreateRelativeValuesDefinitionResult;

export type MutationCreateSquiggleSnippetModelInput = {
  code: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type MutationCreateSquiggleSnippetModelResult = BaseError | CreateSquiggleSnippetResult;

export type MutationDeleteMembershipInput = {
  membershipId: Scalars['String']['input'];
};

export type MutationDeleteMembershipResult = BaseError | DeleteMembershipResult;

export type MutationDeleteModelInput = {
  slug: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type MutationDeleteModelResult = BaseError | DeleteModelResult;

export type MutationDeleteRelativeValuesDefinitionInput = {
  slug: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type MutationDeleteRelativeValuesDefinitionResult = BaseError | DeleteRelativeValuesDefinitionResult;

export type MutationInviteUserToGroupInput = {
  group: Scalars['String']['input'];
  role: MembershipRole;
  username: Scalars['String']['input'];
};

export type MutationInviteUserToGroupResult = BaseError | InviteUserToGroupResult;

export type MutationReactToGroupInviteInput = {
  action: GroupInviteReaction;
  inviteId: Scalars['String']['input'];
};

export type MutationReactToGroupInviteResult = BaseError | ReactToGroupInviteResult;

export type MutationSetUsernameResult = BaseError | Me;

export type MutationUpdateGroupInviteRoleInput = {
  inviteId: Scalars['String']['input'];
  role: MembershipRole;
};

export type MutationUpdateGroupInviteRoleResult = BaseError | UpdateGroupInviteRoleResult;

export type MutationUpdateMembershipRoleInput = {
  membershipId: Scalars['String']['input'];
  role: MembershipRole;
};

export type MutationUpdateMembershipRoleResult = BaseError | UpdateMembershipRoleResult;

export type MutationUpdateModelPrivacyInput = {
  isPrivate: Scalars['Boolean']['input'];
  slug: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type MutationUpdateModelPrivacyResult = BaseError | UpdateModelPrivacyResult;

export type MutationUpdateModelSlugInput = {
  newSlug: Scalars['String']['input'];
  oldSlug: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type MutationUpdateModelSlugResult = BaseError | UpdateModelSlugResult;

export type MutationUpdateRelativeValuesDefinitionInput = {
  clusters: Array<RelativeValuesClusterInput>;
  items: Array<RelativeValuesItemInput>;
  recommendedUnit?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
  title: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type MutationUpdateRelativeValuesDefinitionResult = BaseError | UpdateRelativeValuesDefinitionResult;

export type MutationUpdateSquiggleSnippetModelInput = {
  /** @deprecated Use content arg instead */
  code?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<SquiggleSnippetContentInput>;
  relativeValuesExports?: InputMaybe<Array<RelativeValuesExportInput>>;
  slug: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type MutationUpdateSquiggleSnippetModelResult = BaseError | UpdateSquiggleSnippetResult;

export type Node = {
  id: Scalars['ID']['output'];
};

export type NotFoundError = Error & {
  __typename?: 'NotFoundError';
  message: Scalars['String']['output'];
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
  groups: GroupConnection;
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

export type QueryModelInput = {
  ownerUsername: Scalars['String']['input'];
  slug: Scalars['String']['input'];
};

export type QueryModelResult = BaseError | Model | NotFoundError;

export type QueryRelativeValuesDefinitionInput = {
  ownerUsername: Scalars['String']['input'];
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
  modelExports: Array<RelativeValuesExport>;
  owner: User;
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
  ownerUsername?: InputMaybe<Scalars['String']['input']>;
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

export type User = Node & {
  __typename?: 'User';
  id: Scalars['ID']['output'];
  models: ModelConnection;
  relativeValuesDefinitions: RelativeValuesDefinitionConnection;
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

export type CreateGroupTestMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateGroupTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'CreateGroupResult', group: { __typename?: 'Group', id: string, slug: string, memberships: { __typename?: 'UserGroupMembershipConnection', edges: Array<{ __typename?: 'UserGroupMembershipEdge', node: { __typename?: 'UserGroupMembership', role: MembershipRole, user: { __typename?: 'User', username: string } } }> } } } };

export type CreateGroupMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateGroupMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError' } | { __typename: 'CreateGroupResult' } };

export type InviteTestMutationVariables = Exact<{ [key: string]: never; }>;


export type InviteTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'InviteUserToGroupResult', invite: { __typename?: 'EmailGroupInvite', id: string, role: MembershipRole } | { __typename?: 'UserGroupInvite', id: string, role: MembershipRole } } };

export type NoAuthInviteTestMutationVariables = Exact<{ [key: string]: never; }>;


export type NoAuthInviteTestMutation = { __typename?: 'Mutation', result: { __typename: 'BaseError', message: string } | { __typename: 'InviteUserToGroupResult' } };

export type TestMeQueryVariables = Exact<{ [key: string]: never; }>;


export type TestMeQuery = { __typename?: 'Query', me: { __typename: 'Me', email?: string | null, username?: string | null } };

export type TestModelsQueryVariables = Exact<{ [key: string]: never; }>;


export type TestModelsQuery = { __typename?: 'Query', models: { __typename?: 'ModelConnection', edges: Array<{ __typename?: 'ModelEdge', node: { __typename?: 'Model', slug: string } }> } };


export const CreateGroupTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGroupTest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"slug"},"value":{"kind":"StringValue","value":"testgroup","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"memberships"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<CreateGroupTestMutation, CreateGroupTestMutationVariables>;
export const CreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"slug"},"value":{"kind":"StringValue","value":"testgroup","block":false}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]} as unknown as DocumentNode<CreateGroupMutation, CreateGroupMutationVariables>;
export const InviteTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteTest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"inviteUserToGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"group"},"value":{"kind":"StringValue","value":"testgroup","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"username"},"value":{"kind":"StringValue","value":"mockmember","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"role"},"value":{"kind":"EnumValue","value":"Member"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"InviteUserToGroupResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invite"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]}}]} as unknown as DocumentNode<InviteTestMutation, InviteTestMutationVariables>;
export const NoAuthInviteTestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NoAuthInviteTest"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"inviteUserToGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"group"},"value":{"kind":"StringValue","value":"testgroup","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"username"},"value":{"kind":"StringValue","value":"mockmember","block":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"role"},"value":{"kind":"EnumValue","value":"Member"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<NoAuthInviteTestMutation, NoAuthInviteTestMutationVariables>;
export const TestMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}}]}}]} as unknown as DocumentNode<TestMeQuery, TestMeQueryVariables>;
export const TestModelsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TestModels"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"models"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TestModelsQuery, TestModelsQueryVariables>;