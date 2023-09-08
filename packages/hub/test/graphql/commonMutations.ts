import { graphql } from "../gql-gen";
import { executeCommonOperation } from "./helpers";

const CreateGroup = graphql(/* GraphQL */ `
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

const CreateModel = graphql(/* GraphQL */ `
  mutation Test_CreateModel($input: MutationCreateSquiggleSnippetModelInput!) {
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

export const commonTestMutationNodes = {
  CreateGroup,
  CreateModel,
};

// These are optimized for convenience; their signatures don't match the underlying mutation's signature.
// Tests use these mutations when testing the mutation is not the goal of a test; instead, mutations are used to create underlying data for testing other queries and mutations.
export const commonTestMutations = {
  createGroup: async (slug: string) =>
    executeCommonOperation(CreateGroup, {
      variables: { input: { slug } },
      expectedTypename: "CreateGroupResult",
    }),
  createModel: async ({
    slug,
    groupSlug,
  }: {
    slug: string;
    groupSlug?: string;
  }) =>
    executeCommonOperation(CreateModel, {
      variables: { input: { groupSlug, slug, code: "2+2" } },
      expectedTypename: "CreateSquiggleSnippetModelResult",
    }),
};
