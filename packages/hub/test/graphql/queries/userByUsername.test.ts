import { graphql } from "../../gql-gen";
import { executeCommonOperation, setCurrentUser } from "../helpers";

const query = graphql(/* GraphQL */ `
  query TestUserByUsername($username: String!) {
    result: userByUsername(username: $username) {
      __typename
      ... on User {
        slug
        username
      }
      ... on Error {
        message
      }
    }
  }
`);

test("find self", async () => {
  await setCurrentUser("mockuser");
  const user = await executeCommonOperation(query, {
    variables: { username: "mockuser" },
    expectedTypename: "User",
  });

  expect(user.slug).toBe("mockuser");
  expect(user.username).toBe("mockuser");
});

test("find other user", async () => {
  await setCurrentUser("mockuser");
  await setCurrentUser("mockuser2");
  await setCurrentUser("mockuser3");
  const user = await executeCommonOperation(query, {
    variables: { username: "mockuser2" },
    expectedTypename: "User",
  });

  expect(user.slug).toBe("mockuser2");
  expect(user.username).toBe("mockuser2");
});

test("not found", async () => {
  await setCurrentUser("mockuser");
  const error = await executeCommonOperation(query, {
    variables: { username: "mockuser2" },
    expectedTypename: "NotFoundError",
  });

  expect(error.message).toBe("User mockuser2 not found");
});
