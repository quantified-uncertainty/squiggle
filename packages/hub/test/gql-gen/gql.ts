/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n      query Test_MyMembership($slug: String!) {\n        result: group(slug: $slug) {\n          __typename\n          ... on Group {\n            id\n            myMembership {\n              id\n              role\n            }\n          }\n        }\n      }\n    ": types.Test_MyMembershipDocument,
    "\n      query Test_Memberships($slug: String!) {\n        result: group(slug: $slug) {\n          __typename\n          ... on Group {\n            id\n            memberships {\n              edges {\n                node {\n                  id\n                  role\n                  user {\n                    slug\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    ": types.Test_MembershipsDocument,
    "\n    mutation Test_CreateGroup($input: MutationCreateGroupInput!) {\n      result: createGroup(input: $input) {\n        __typename\n        ... on Error {\n          message\n        }\n        ... on CreateGroupResult {\n          group {\n            id\n          }\n        }\n      }\n    }\n  ": types.Test_CreateGroupDocument,
    "\n    mutation Test_CreateModel(\n      $input: MutationCreateSquiggleSnippetModelInput!\n    ) {\n      result: createSquiggleSnippetModel(input: $input) {\n        __typename\n        ... on Error {\n          message\n        }\n        ... on CreateSquiggleSnippetModelResult {\n          model {\n            id\n          }\n        }\n      }\n    }\n  ": types.Test_CreateModelDocument,
    "\n      mutation Test_Invite($input: MutationInviteUserToGroupInput!) {\n        result: inviteUserToGroup(input: $input) {\n          __typename\n          ... on BaseError {\n            message\n          }\n          ... on InviteUserToGroupResult {\n            invite {\n              id\n            }\n          }\n        }\n      }\n    ": types.Test_InviteDocument,
    "\n      mutation Test_AcceptInvite($input: MutationReactToGroupInviteInput!) {\n        result: reactToGroupInvite(input: $input) {\n          __typename\n          ... on BaseError {\n            message\n          }\n          ... on ReactToGroupInviteResult {\n            __typename\n          }\n        }\n      }\n    ": types.Test_AcceptInviteDocument,
    "\n  mutation CreateGroupTest {\n    result: createGroup(input: { slug: \"testgroup\" }) {\n      __typename\n      ... on CreateGroupResult {\n        group {\n          id\n          slug\n          memberships {\n            edges {\n              node {\n                user {\n                  username\n                }\n                role\n              }\n            }\n          }\n        }\n      }\n      ... on BaseError {\n        message\n      }\n    }\n  }\n": types.CreateGroupTestDocument,
    "\n  mutation CreateSquiggleSnippetModelTest(\n    $input: MutationCreateSquiggleSnippetModelInput!\n  ) {\n    result: createSquiggleSnippetModel(input: $input) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on ValidationError {\n        issues {\n          message\n        }\n      }\n      ... on CreateSquiggleSnippetModelResult {\n        model {\n          id\n          slug\n          isPrivate\n          owner {\n            __typename\n            slug\n          }\n        }\n      }\n    }\n  }\n": types.CreateSquiggleSnippetModelTestDocument,
    "\n    mutation DeleteMembershipTest($group: String!, $user: String!) {\n      result: deleteMembership(input: { group: $group, user: $user }) {\n        __typename\n        ... on BaseError {\n          message\n        }\n        ... on DeleteMembershipResult {\n          ok\n        }\n      }\n    }\n  ": types.DeleteMembershipTestDocument,
    "\n  mutation DeleteModelTest($input: MutationDeleteModelInput!) {\n    result: deleteModel(input: $input) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on NotFoundError {\n        message\n      }\n      ... on DeleteModelResult {\n        ok\n      }\n    }\n  }\n": types.DeleteModelTestDocument,
    "\n    mutation InviteTest($input: MutationInviteUserToGroupInput!) {\n      result: inviteUserToGroup(input: $input) {\n        __typename\n        ... on BaseError {\n          message\n        }\n        ... on InviteUserToGroupResult {\n          invite {\n            id\n            role\n          }\n        }\n      }\n    }\n  ": types.InviteTestDocument,
    "\n  mutation SetUsernameTest($username: String!) {\n    result: setUsername(username: $username) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on ValidationError {\n        message\n      }\n      ... on Me {\n        email\n        username\n      }\n    }\n  }\n": types.SetUsernameTestDocument,
    "\n    query TestGroups($input: GroupsQueryInput!) {\n      result: groups(first: 10, input: $input) {\n        __typename\n        edges {\n          node {\n            id\n            slug\n          }\n        }\n      }\n    }\n  ": types.TestGroupsDocument,
    "\n      query TestMe {\n        me {\n          __typename\n          email\n          username\n        }\n      }\n    ": types.TestMeDocument,
    "\n  query TestModels {\n    models {\n      edges {\n        node {\n          slug\n          isEditable\n          isPrivate\n          owner {\n            __typename\n            slug\n          }\n        }\n      }\n    }\n  }\n": types.TestModelsDocument,
    "\n  mutation TestModels_createModel(\n    $input: MutationCreateSquiggleSnippetModelInput!\n  ) {\n    result: createSquiggleSnippetModel(input: $input) {\n      __typename\n    }\n  }\n": types.TestModels_CreateModelDocument,
    "\n  query TestUserByUsername($username: String!) {\n    result: userByUsername(username: $username) {\n      __typename\n      ... on User {\n        slug\n        username\n      }\n      ... on Error {\n        message\n      }\n    }\n  }\n": types.TestUserByUsernameDocument,
    "\n  query TestUsers($input: UsersQueryInput) {\n    result: users(input: $input) {\n      edges {\n        node {\n          username\n        }\n      }\n    }\n  }\n": types.TestUsersDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query Test_MyMembership($slug: String!) {\n        result: group(slug: $slug) {\n          __typename\n          ... on Group {\n            id\n            myMembership {\n              id\n              role\n            }\n          }\n        }\n      }\n    "): (typeof documents)["\n      query Test_MyMembership($slug: String!) {\n        result: group(slug: $slug) {\n          __typename\n          ... on Group {\n            id\n            myMembership {\n              id\n              role\n            }\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query Test_Memberships($slug: String!) {\n        result: group(slug: $slug) {\n          __typename\n          ... on Group {\n            id\n            memberships {\n              edges {\n                node {\n                  id\n                  role\n                  user {\n                    slug\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    "): (typeof documents)["\n      query Test_Memberships($slug: String!) {\n        result: group(slug: $slug) {\n          __typename\n          ... on Group {\n            id\n            memberships {\n              edges {\n                node {\n                  id\n                  role\n                  user {\n                    slug\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation Test_CreateGroup($input: MutationCreateGroupInput!) {\n      result: createGroup(input: $input) {\n        __typename\n        ... on Error {\n          message\n        }\n        ... on CreateGroupResult {\n          group {\n            id\n          }\n        }\n      }\n    }\n  "): (typeof documents)["\n    mutation Test_CreateGroup($input: MutationCreateGroupInput!) {\n      result: createGroup(input: $input) {\n        __typename\n        ... on Error {\n          message\n        }\n        ... on CreateGroupResult {\n          group {\n            id\n          }\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation Test_CreateModel(\n      $input: MutationCreateSquiggleSnippetModelInput!\n    ) {\n      result: createSquiggleSnippetModel(input: $input) {\n        __typename\n        ... on Error {\n          message\n        }\n        ... on CreateSquiggleSnippetModelResult {\n          model {\n            id\n          }\n        }\n      }\n    }\n  "): (typeof documents)["\n    mutation Test_CreateModel(\n      $input: MutationCreateSquiggleSnippetModelInput!\n    ) {\n      result: createSquiggleSnippetModel(input: $input) {\n        __typename\n        ... on Error {\n          message\n        }\n        ... on CreateSquiggleSnippetModelResult {\n          model {\n            id\n          }\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation Test_Invite($input: MutationInviteUserToGroupInput!) {\n        result: inviteUserToGroup(input: $input) {\n          __typename\n          ... on BaseError {\n            message\n          }\n          ... on InviteUserToGroupResult {\n            invite {\n              id\n            }\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation Test_Invite($input: MutationInviteUserToGroupInput!) {\n        result: inviteUserToGroup(input: $input) {\n          __typename\n          ... on BaseError {\n            message\n          }\n          ... on InviteUserToGroupResult {\n            invite {\n              id\n            }\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation Test_AcceptInvite($input: MutationReactToGroupInviteInput!) {\n        result: reactToGroupInvite(input: $input) {\n          __typename\n          ... on BaseError {\n            message\n          }\n          ... on ReactToGroupInviteResult {\n            __typename\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation Test_AcceptInvite($input: MutationReactToGroupInviteInput!) {\n        result: reactToGroupInvite(input: $input) {\n          __typename\n          ... on BaseError {\n            message\n          }\n          ... on ReactToGroupInviteResult {\n            __typename\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateGroupTest {\n    result: createGroup(input: { slug: \"testgroup\" }) {\n      __typename\n      ... on CreateGroupResult {\n        group {\n          id\n          slug\n          memberships {\n            edges {\n              node {\n                user {\n                  username\n                }\n                role\n              }\n            }\n          }\n        }\n      }\n      ... on BaseError {\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateGroupTest {\n    result: createGroup(input: { slug: \"testgroup\" }) {\n      __typename\n      ... on CreateGroupResult {\n        group {\n          id\n          slug\n          memberships {\n            edges {\n              node {\n                user {\n                  username\n                }\n                role\n              }\n            }\n          }\n        }\n      }\n      ... on BaseError {\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateSquiggleSnippetModelTest(\n    $input: MutationCreateSquiggleSnippetModelInput!\n  ) {\n    result: createSquiggleSnippetModel(input: $input) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on ValidationError {\n        issues {\n          message\n        }\n      }\n      ... on CreateSquiggleSnippetModelResult {\n        model {\n          id\n          slug\n          isPrivate\n          owner {\n            __typename\n            slug\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSquiggleSnippetModelTest(\n    $input: MutationCreateSquiggleSnippetModelInput!\n  ) {\n    result: createSquiggleSnippetModel(input: $input) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on ValidationError {\n        issues {\n          message\n        }\n      }\n      ... on CreateSquiggleSnippetModelResult {\n        model {\n          id\n          slug\n          isPrivate\n          owner {\n            __typename\n            slug\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation DeleteMembershipTest($group: String!, $user: String!) {\n      result: deleteMembership(input: { group: $group, user: $user }) {\n        __typename\n        ... on BaseError {\n          message\n        }\n        ... on DeleteMembershipResult {\n          ok\n        }\n      }\n    }\n  "): (typeof documents)["\n    mutation DeleteMembershipTest($group: String!, $user: String!) {\n      result: deleteMembership(input: { group: $group, user: $user }) {\n        __typename\n        ... on BaseError {\n          message\n        }\n        ... on DeleteMembershipResult {\n          ok\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteModelTest($input: MutationDeleteModelInput!) {\n    result: deleteModel(input: $input) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on NotFoundError {\n        message\n      }\n      ... on DeleteModelResult {\n        ok\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteModelTest($input: MutationDeleteModelInput!) {\n    result: deleteModel(input: $input) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on NotFoundError {\n        message\n      }\n      ... on DeleteModelResult {\n        ok\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation InviteTest($input: MutationInviteUserToGroupInput!) {\n      result: inviteUserToGroup(input: $input) {\n        __typename\n        ... on BaseError {\n          message\n        }\n        ... on InviteUserToGroupResult {\n          invite {\n            id\n            role\n          }\n        }\n      }\n    }\n  "): (typeof documents)["\n    mutation InviteTest($input: MutationInviteUserToGroupInput!) {\n      result: inviteUserToGroup(input: $input) {\n        __typename\n        ... on BaseError {\n          message\n        }\n        ... on InviteUserToGroupResult {\n          invite {\n            id\n            role\n          }\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetUsernameTest($username: String!) {\n    result: setUsername(username: $username) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on ValidationError {\n        message\n      }\n      ... on Me {\n        email\n        username\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SetUsernameTest($username: String!) {\n    result: setUsername(username: $username) {\n      __typename\n      ... on Error {\n        message\n      }\n      ... on ValidationError {\n        message\n      }\n      ... on Me {\n        email\n        username\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query TestGroups($input: GroupsQueryInput!) {\n      result: groups(first: 10, input: $input) {\n        __typename\n        edges {\n          node {\n            id\n            slug\n          }\n        }\n      }\n    }\n  "): (typeof documents)["\n    query TestGroups($input: GroupsQueryInput!) {\n      result: groups(first: 10, input: $input) {\n        __typename\n        edges {\n          node {\n            id\n            slug\n          }\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query TestMe {\n        me {\n          __typename\n          email\n          username\n        }\n      }\n    "): (typeof documents)["\n      query TestMe {\n        me {\n          __typename\n          email\n          username\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TestModels {\n    models {\n      edges {\n        node {\n          slug\n          isEditable\n          isPrivate\n          owner {\n            __typename\n            slug\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TestModels {\n    models {\n      edges {\n        node {\n          slug\n          isEditable\n          isPrivate\n          owner {\n            __typename\n            slug\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TestModels_createModel(\n    $input: MutationCreateSquiggleSnippetModelInput!\n  ) {\n    result: createSquiggleSnippetModel(input: $input) {\n      __typename\n    }\n  }\n"): (typeof documents)["\n  mutation TestModels_createModel(\n    $input: MutationCreateSquiggleSnippetModelInput!\n  ) {\n    result: createSquiggleSnippetModel(input: $input) {\n      __typename\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TestUserByUsername($username: String!) {\n    result: userByUsername(username: $username) {\n      __typename\n      ... on User {\n        slug\n        username\n      }\n      ... on Error {\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  query TestUserByUsername($username: String!) {\n    result: userByUsername(username: $username) {\n      __typename\n      ... on User {\n        slug\n        username\n      }\n      ... on Error {\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TestUsers($input: UsersQueryInput) {\n    result: users(input: $input) {\n      edges {\n        node {\n          username\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TestUsers($input: UsersQueryInput) {\n    result: users(input: $input) {\n      edges {\n        node {\n          username\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;