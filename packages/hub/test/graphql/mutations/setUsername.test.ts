import { graphql } from "../../gql-gen";
import {
  createRunners,
  executeCommonOperation,
  setCurrentUserObject,
} from "../helpers";

const SetUsernameTest = graphql(/* GraphQL */ `
  mutation SetUsernameTest($username: String!) {
    result: setUsername(username: $username) {
      __typename
      ... on Error {
        message
      }
      ... on ValidationError {
        message
      }
      ... on Me {
        email
        username
      }
    }
  }
`);

const { runOk, runError } = createRunners(SetUsernameTest, "Me");

test("no auth", async () => {
  const result = await runError({ username: "mockuser" }, "BaseError");
  expect(result.message).toMatch("Not authorized");
});

test("already set", async () => {
  await setCurrentUserObject({
    email: "mock@example.com",
    username: "mockuser",
  });

  const result = await runError({ username: "mockuser2" }, "BaseError");
  expect(result.message).toMatch("Username is already set");
});

test("bad username", async () => {
  await setCurrentUserObject({ email: "mock@example.com" });
  const result = await runError({ username: "foo bar" }, "ValidationError");
  expect(result.message).toMatch("[username] Must be alphanumerical");
});

test("not available", async () => {
  await setCurrentUserObject({ email: "mock@example.com" });
  await runOk({ username: "mockuser" });

  await setCurrentUserObject({ email: "mock2@example.com" });
  const result = await runError({ username: "mockuser" }, "BaseError");

  expect(result.message).toMatch("Username mockuser is not available");
});

test("basic", async () => {
  await setCurrentUserObject({ email: "mock@example.com" });
  const result = await runOk({ username: "mockuser" });

  expect(result).toMatchObject({
    email: "mock@example.com",
    username: "mockuser",
  });
});
