import { graphql } from "../../gql-gen";
import { executeCommonOperation, setCurrentUser } from "../executor";

const CreateGroupTest = graphql(/* GraphQL */ `
  mutation CreateGroupTest {
    result: createGroup(input: { slug: "testgroup" }) {
      __typename
      ... on CreateGroupResult {
        group {
          id
          slug
          memberships {
            edges {
              node {
                user {
                  username
                }
                role
              }
            }
          }
        }
      }
      ... on BaseError {
        message
      }
    }
  }
`);

test("no auth", async () => {
  const result = await executeCommonOperation(CreateGroupTest, {
    expectedTypename: "BaseError",
  });
  expect(result.message).toMatch("Not authorized");
});

test("basic", async () => {
  await setCurrentUser({ email: "mock@example.com", username: "mockuser" });
  const result = await executeCommonOperation(CreateGroupTest, {
    expectedTypename: "CreateGroupResult",
  });

  expect(result).toMatchObject({
    group: {
      slug: "testgroup",
    },
  });
  expect(result.group.memberships).toEqual({
    edges: [
      {
        node: {
          user: {
            username: "mockuser",
          },
          role: "Admin",
        },
      },
    ],
  });
});
