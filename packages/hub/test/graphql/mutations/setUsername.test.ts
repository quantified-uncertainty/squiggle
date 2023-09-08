import { graphql } from "../../gql-gen";
import {
  createRunners,
  executeCommonOperation,
  setCurrentUser,
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
  await setCurrentUser({ email: "mock@example.com", username: "mockuser" });
  const result = await runError({ username: "mockuser2" }, "BaseError");
  expect(result.message).toMatch("Username is already set");
});

test("bad username", async () => {
  await setCurrentUser({ email: "mock@example.com" });
  const result = await runError({ username: "foo bar" }, "ValidationError");
  expect(result.message).toMatch("[username] Must be alphanumerical");
});

test("basic", async () => {
  await setCurrentUser({ email: "mock@example.com" });
  const result = await runOk({ username: "mockuser" });

  expect(result).toMatchObject({
    email: "mock@example.com",
    username: "mockuser",
  });
});
