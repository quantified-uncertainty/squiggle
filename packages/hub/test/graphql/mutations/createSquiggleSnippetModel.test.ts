import { graphql } from "../../gql-gen";
import { commonTestMutations } from "../commonQueries";
import { createInputRunners, setCurrentUser } from "../helpers";

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

const { runOk, runError } = createInputRunners(
  Mutation,
  "CreateSquiggleSnippetModelResult"
);

test("no auth", async () => {
  const result = await runError(
    { code: "2+2", slug: "testmodel" },
    "BaseError"
  );
  expect(result.message).toMatch("Not authorized");
});

test("bad slug", async () => {
  await setCurrentUser("mockuser");
  const result = await runError(
    { code: "2+2", slug: "foo bar" },
    "ValidationError"
  );
  expect(result.message).toMatch("[input.slug] Must be alphanumerical");
});

test("basic", async () => {
  await setCurrentUser("mockuser");
  const result = await runOk({ code: "2+2", slug: "testmodel" });

  expect(result.model.slug).toBe("testmodel");
  expect(result.model.owner.__typename).toBe("User");
  expect(result.model.owner.slug).toBe("mockuser");
  expect(result.model.isPrivate).toBe(false);
});

test("private", async () => {
  await setCurrentUser("mockuser");
  const result = await runOk({
    code: "2+2",
    slug: "testmodel",
    isPrivate: true,
  });

  expect(result.model.slug).toBe("testmodel");
  expect(result.model.owner.__typename).toBe("User");
  expect(result.model.owner.slug).toBe("mockuser");
  expect(result.model.isPrivate).toBe(true);
});

test("for group", async () => {
  await setCurrentUser("mockuser");
  await commonTestMutations.createGroup("testgroup");

  const result = await runOk({
    code: "2+2",
    slug: "testmodel",
    groupSlug: "testgroup",
  });

  expect(result.model.owner.__typename).toBe("Group");
  expect(result.model.owner.slug).toBe("testgroup");
});

test("for group with bad slug", async () => {
  await setCurrentUser("mockuser");

  const result = await runError(
    {
      code: "2+2",
      slug: "testmodel",
      groupSlug: "no such group",
    },
    "ValidationError"
  );

  expect(result.message).toMatch("[input.groupSlug] Must be alphanumerical");
});

test("duplicate", async () => {
  await setCurrentUser("mockuser");

  await runOk({ code: "2+2", slug: "testmodel" });

  const result = await runError(
    { code: "2+2", slug: "testmodel" },
    "BaseError"
  );

  expect(result.message).toMatch(
    "Model testmodel already exists on this account"
  );
});
