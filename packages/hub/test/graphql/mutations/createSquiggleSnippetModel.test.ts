import { graphql } from "../../gql-gen";
import { executeCommonOperation, setCurrentUser } from "../executor";

const Mutation = graphql(/* GraphQL */ `
  mutation CreateSquiggleSnippetModelTest(
    $input: MutationCreateSquiggleSnippetModelInput!
  ) {
    result: createSquiggleSnippetModel(input: $input) {
      __typename
      ... on Error {
        message
      }
      ... on ValidationError {
        issues {
          message
        }
      }
      ... on CreateSquiggleSnippetModelResult {
        model {
          id
          slug
          isPrivate
          owner {
            __typename
            slug
          }
        }
      }
    }
  }
`);

const CreateGroup = graphql(/* GraphQL */ `
  mutation CreateSquiggleSnippetModelTest_createGroup(
    $input: MutationCreateGroupInput!
  ) {
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

const user = { email: "mock@example.com", username: "mockuser" };

test("no auth", async () => {
  const result = await executeCommonOperation(Mutation, {
    variables: { input: { code: "2+2", slug: "testmodel" } },
    expectedTypename: "BaseError",
  });
  expect(result.message).toMatch("Not authorized");
});

test("bad slug", async () => {
  await setCurrentUser(user);
  const result = await executeCommonOperation(Mutation, {
    variables: { input: { code: "2+2", slug: "foo bar" } },
    expectedTypename: "ValidationError",
  });
  expect(result.message).toMatch("[input.slug] Must be alphanumerical");
});

test("basic", async () => {
  await setCurrentUser(user);
  const result = await executeCommonOperation(Mutation, {
    variables: { input: { code: "2+2", slug: "testmodel" } },
    expectedTypename: "CreateSquiggleSnippetModelResult",
  });

  expect(result.model.slug).toBe("testmodel");
  expect(result.model.owner.__typename).toBe("User");
  expect(result.model.owner.slug).toBe("mockuser");
  expect(result.model.isPrivate).toBe(false);
});

test("private", async () => {
  await setCurrentUser(user);
  const result = await executeCommonOperation(Mutation, {
    variables: { input: { code: "2+2", slug: "testmodel", isPrivate: true } },
    expectedTypename: "CreateSquiggleSnippetModelResult",
  });

  expect(result.model.slug).toBe("testmodel");
  expect(result.model.owner.__typename).toBe("User");
  expect(result.model.owner.slug).toBe("mockuser");
  expect(result.model.isPrivate).toBe(true);
});

test("for group", async () => {
  await setCurrentUser(user);
  await executeCommonOperation(CreateGroup, {
    variables: {
      input: { slug: "testgroup" },
    },
    expectedTypename: "CreateGroupResult",
  });

  const result = await executeCommonOperation(Mutation, {
    variables: {
      input: { code: "2+2", slug: "testmodel", groupSlug: "testgroup" },
    },
    expectedTypename: "CreateSquiggleSnippetModelResult",
  });

  expect(result.model.owner.__typename).toBe("Group");
  expect(result.model.owner.slug).toBe("testgroup");
});

test("for group with bad slug", async () => {
  await setCurrentUser(user);

  const result = await executeCommonOperation(Mutation, {
    variables: {
      input: { code: "2+2", slug: "testmodel", groupSlug: "no such group" },
    },
    expectedTypename: "ValidationError",
  });

  expect(result.message).toMatch("[input.groupSlug] Must be alphanumerical");
});

test("duplicate", async () => {
  await setCurrentUser(user);

  await executeCommonOperation(Mutation, {
    variables: {
      input: { code: "2+2", slug: "testmodel" },
    },
    expectedTypename: "CreateSquiggleSnippetModelResult",
  });

  const result = await executeCommonOperation(Mutation, {
    variables: {
      input: { code: "2+2", slug: "testmodel" },
    },
    expectedTypename: "BaseError",
  });

  expect(result.message).toMatch(
    "Model testmodel already exists on this account"
  );
});
