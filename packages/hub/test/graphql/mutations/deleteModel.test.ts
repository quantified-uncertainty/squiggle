import { graphql } from "../../gql-gen";
import { commonTestMutations } from "../commonQueries";
import { createInputRunners, setCurrentUser } from "../helpers";

const Mutation = graphql(/* GraphQL */ `
  mutation DeleteModelTest($input: MutationDeleteModelInput!) {
    result: deleteModel(input: $input) {
      __typename
      ... on Error {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on DeleteModelResult {
        ok
      }
    }
  }
`);

const { runOk, runError } = createInputRunners(Mutation, "DeleteModelResult");

test("no auth", async () => {
  const result = await runError(
    { owner: "testuser", slug: "testmodel" },
    "BaseError"
  );
  expect(result.message).toMatch("Not authorized");
});

test("no such model", async () => {
  await setCurrentUser("mockuser");
  const result = await runError(
    { owner: "testuser", slug: "testmodel" },
    "NotFoundError"
  );
  expect(result.message).toMatch("Can't find model");
});

test("ok", async () => {
  await setCurrentUser("mockuser");
  await commonTestMutations.createModel({ slug: "testmodel" });

  const result = await runOk({ owner: "mockuser", slug: "testmodel" });
  expect(result.ok).toBe(true);
});

test("double delete", async () => {
  const owner = "mockuser";
  const slug = "testmodel";
  await setCurrentUser(owner);
  await commonTestMutations.createModel({ slug });

  await runOk({ owner, slug });
  const result = await runError({ owner, slug }, "NotFoundError");

  expect(result.message).toMatch("Can't find model");
});

test("wrong user", async () => {
  const owner = "mockuser";
  const otherUser = "user2";
  await setCurrentUser(owner);
  await commonTestMutations.createModel({ slug: "testmodel" });
  await setCurrentUser(otherUser);

  const result = await runError(
    { owner, slug: "testmodel" },
    "NotFoundError" // TODO - error should be more specific
  );
  expect(result.message).toMatch("Can't find model");
});

test("deleting group model", async () => {
  const groupSlug = "group1";

  await setCurrentUser("mockuser");
  await commonTestMutations.createGroup(groupSlug);
  await commonTestMutations.createModel({ groupSlug, slug: "testmodel" });

  const result = await runOk({ owner: groupSlug, slug: "testmodel" });
  expect(result.ok).toBe(true);
});
