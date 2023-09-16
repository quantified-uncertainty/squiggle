import { graphql } from "../gql-gen";
import { GroupInviteReaction, MembershipRole } from "../gql-gen/graphql";
import {
  executeCommonOperation,
  setCurrentUser,
  unsetCurrentUser,
} from "./helpers";

export const commonTestQueries = {
  myMembership: async (groupSlug: string) => {
    const query = graphql(/* GraphQL */ `
      query Test_MyMembership($slug: String!) {
        result: group(slug: $slug) {
          __typename
          ... on Group {
            id
            myMembership {
              id
              role
            }
          }
        }
      }
    `);
    const group = await executeCommonOperation(query, {
      variables: { slug: groupSlug },
      expectedTypename: "Group",
    });
    return group?.myMembership;
  },

  memberships: async (groupSlug: string) => {
    const query = graphql(/* GraphQL */ `
      query Test_Memberships($slug: String!) {
        result: group(slug: $slug) {
          __typename
          ... on Group {
            id
            memberships {
              edges {
                node {
                  id
                  role
                  user {
                    slug
                  }
                }
              }
            }
          }
        }
      }
    `);
    const group = await executeCommonOperation(query, {
      variables: { slug: groupSlug },
      expectedTypename: "Group",
    });
    return group?.memberships.edges.map((edge) => edge.node);
  },
};

async function createGroup(slug: string) {
  const mutation = graphql(/* GraphQL */ `
    mutation Test_CreateGroup($input: MutationCreateGroupInput!) {
      result: createGroup(input: $input) {
        __typename
        ... on Error {
          message
        }
        ... on CreateGroupResult {
          group {
            id
          }
        }
      }
    }
  `);

  return await executeCommonOperation(mutation, {
    variables: { input: { slug } },
    expectedTypename: "CreateGroupResult",
  });
}

async function createModel({
  slug,
  groupSlug,
}: {
  slug: string;
  groupSlug?: string;
}) {
  const mutation = graphql(/* GraphQL */ `
    mutation Test_CreateModel(
      $input: MutationCreateSquiggleSnippetModelInput!
    ) {
      result: createSquiggleSnippetModel(input: $input) {
        __typename
        ... on Error {
          message
        }
        ... on CreateSquiggleSnippetModelResult {
          model {
            id
          }
        }
      }
    }
  `);

  return await executeCommonOperation(mutation, {
    variables: { input: { groupSlug, slug, code: "2+2" } },
    expectedTypename: "CreateSquiggleSnippetModelResult",
  });
}

// note that the user is unset after this function
async function addMember({
  group,
  admin,
  user,
  role,
}: {
  // all of group, admin, user must already exist
  group: string;
  admin: string;
  user: string;
  role: MembershipRole;
}) {
  await setCurrentUser(admin);

  const { invite } = await executeCommonOperation(
    graphql(/* GraphQL */ `
      mutation Test_Invite($input: MutationInviteUserToGroupInput!) {
        result: inviteUserToGroup(input: $input) {
          __typename
          ... on BaseError {
            message
          }
          ... on InviteUserToGroupResult {
            invite {
              id
            }
          }
        }
      }
    `),
    {
      variables: {
        input: { group, username: user, role },
      },
      expectedTypename: "InviteUserToGroupResult",
    }
  );

  await setCurrentUser(user);
  await executeCommonOperation(
    graphql(/* GraphQL */ `
      mutation Test_AcceptInvite($input: MutationReactToGroupInviteInput!) {
        result: reactToGroupInvite(input: $input) {
          __typename
          ... on BaseError {
            message
          }
          ... on ReactToGroupInviteResult {
            __typename
          }
        }
      }
    `),
    {
      variables: {
        input: { inviteId: invite.id, action: GroupInviteReaction.Accept },
      },
      expectedTypename: "ReactToGroupInviteResult",
    }
  );
  await unsetCurrentUser();
}

// These are optimized for convenience; their signatures don't match the underlying mutation's signature.
// Tests use these mutations when testing the mutation is not the goal of a test; instead, mutations are used to create underlying data for testing other queries and mutations.
export const commonTestMutations = {
  createGroup,
  createModel,
  addMember,
};
