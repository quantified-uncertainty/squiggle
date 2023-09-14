import { graphql } from "../../gql-gen";
import {
  executeOperation,
  setCurrentUser,
  setCurrentUserObject,
} from "../helpers";

const query = graphql(/* GraphQL */ `
  query TestUsers($input: UsersQueryInput) {
    result: users(input: $input) {
      edges {
        node {
          username
        }
      }
    }
  }
`);

test("find users", async () => {
  await setCurrentUser("mockuser");
  await setCurrentUser("mockuser2");
  const { result: users } = await executeOperation(query);

  expect(users.edges.length).toBe(2);
});

test("skip users without usernames", async () => {
  await setCurrentUser("mockuser");
  await setCurrentUser("mockuser2");
  await setCurrentUserObject({ email: "mockuser3@example.com" });
  const { result: users } = await executeOperation(query);

  expect(users.edges.length).toBe(2);
});

test("filter by username", async () => {
  await setCurrentUser("mockuser");
  await setCurrentUser("mockuser2");
  await setCurrentUserObject({ email: "mockuser3@example.com" });
  await setCurrentUser("unrelated");
  const { result: users } = await executeOperation(query, {
    input: { usernameContains: "ock" },
  });

  expect(users.edges.length).toBe(2);
  expect(users.edges.map((e) => e.node.username).sort()).toEqual([
    "mockuser",
    "mockuser2",
  ]);
});
