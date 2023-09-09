import { graphql } from "../../gql-gen";
import { createRunners, setCurrentUser } from "../helpers";

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

const { runOk, runError } = createRunners(CreateGroupTest, "CreateGroupResult");

test("no auth", async () => {
  const result = await runError({}, "BaseError");
  expect(result.message).toMatch("Not authorized");
});

test("basic", async () => {
  await setCurrentUser("mockuser");
  const result = await runOk({});

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
