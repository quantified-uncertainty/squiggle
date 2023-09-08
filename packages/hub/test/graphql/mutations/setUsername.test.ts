import { graphql } from "../../gql-gen";
import { executeCommonOperation, setCurrentUser } from "../executor";

const SetUsernameTest = graphql(/* GraphQL */ `
  mutation SetUsernameTest($username: String!) {
    result: setUsername(username: $username) {
      __typename
      ... on Error {
        message
      }
      ... on Me {
        email
        username
      }
    }
  }
`);

test("no auth", async () => {
  const result = await executeCommonOperation(SetUsernameTest, {
    variables: { username: "mockuser" },
    expectedTypename: "BaseError",
  });
  expect(result.message).toMatch("Not authorized");
});

test("already set", async () => {
  await setCurrentUser({ email: "mock@example.com", username: "mockuser" });
  const result = await executeCommonOperation(SetUsernameTest, {
    variables: { username: "mockuser2" },
    expectedTypename: "BaseError",
  });
  expect(result.message).toMatch("Username is already set");
});

test("bad username", async () => {
  await setCurrentUser({ email: "mock@example.com" });
  const result = await executeCommonOperation(SetUsernameTest, {
    variables: { username: "foo bar" },
    expectedTypename: "BaseError",
  });
  expect(result.message).toMatch("Username must be alphanumerical");
});

test("basic", async () => {
  await setCurrentUser({ email: "mock@example.com" });
  const result = await executeCommonOperation(SetUsernameTest, {
    variables: { username: "mockuser" },
    expectedTypename: "Me",
  });

  expect(result).toMatchObject({
    email: "mock@example.com",
    username: "mockuser",
  });
});
