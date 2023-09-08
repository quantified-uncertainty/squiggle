import { graphql } from "../../gql-gen";
import { commonTestMutations } from "../commonMutations";
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

const user = { email: "mock@example.com", username: "mockuser" };
const user2 = { email: "mock2@example.com", username: "mockuser2" };

const { runOk, runError } = createInputRunners(Mutation, "DeleteModelResult");

test("no auth", async () => {
  const result = await runError(
    { owner: "testuser", slug: "testmodel" },
    "BaseError"
  );
  expect(result.message).toMatch("Not authorized");
});

test("no such model", async () => {
  await setCurrentUser(user);
  const result = await runError(
    { owner: "testuser", slug: "testmodel" },
    "NotFoundError"
  );
  expect(result.message).toMatch("Can't find model");
});

test("ok", async () => {
  await setCurrentUser(user);
  await commonTestMutations.createModel({ slug: "testmodel" });

  const result = await runOk({ owner: user.username, slug: "testmodel" });
  expect(result.ok).toBe(true);
});

test("double delete", async () => {
  await setCurrentUser(user);
  await commonTestMutations.createModel({ slug: "testmodel" });

  await runOk({ owner: user.username, slug: "testmodel" });
  const result = await runError(
    { owner: user.username, slug: "testmodel" },
    "NotFoundError"
  );
  expect(result.message).toMatch("Can't find model");
});

test("wrong user", async () => {
  await setCurrentUser(user);
  await commonTestMutations.createModel({ slug: "testmodel" });
  await setCurrentUser(user2);

  const result = await runError(
    { owner: user.username, slug: "testmodel" },
    "NotFoundError" // TODO - error should be more specific
  );
  expect(result.message).toMatch("Can't find model");
});

test("deleting group model", async () => {
  const groupSlug = "group1";

  await setCurrentUser(user);
  await commonTestMutations.createGroup(groupSlug);
  await commonTestMutations.createModel({ groupSlug, slug: "testmodel" });

  const result = await runOk({ owner: groupSlug, slug: "testmodel" });
  expect(result.ok).toBe(true);
});
