import { graphql } from "../../gql-gen";
import {
  executeCommonOperation,
  setCurrentUser,
  unsetCurrentUser,
} from "../executor";

const ownerUser = {
  email: "mock-owner@example.com",
  username: "mockowner",
};

const memberUser = {
  email: "mock-member@example.com",
  username: "mockmember",
};

async function prepareGroup() {
  await setCurrentUser(ownerUser);
  await executeCommonOperation(
    graphql(/* GraphQL */ `
      mutation CreateGroup {
        result: createGroup(input: { slug: "testgroup" }) {
          __typename
        }
      }
    `),
    { expectedTypename: "CreateGroupResult" }
  );
}

test("basic invite", async () => {
  await prepareGroup();
  await setCurrentUser(memberUser);
  await setCurrentUser(ownerUser);
  const result = await executeCommonOperation(
    graphql(/* GraphQL */ `
      mutation InviteTest {
        result: inviteUserToGroup(
          input: { group: "testgroup", username: "mockmember", role: Member }
        ) {
          __typename
          ... on BaseError {
            message
          }
          ... on InviteUserToGroupResult {
            invite {
              id
              role
            }
          }
        }
      }
    `),
    { expectedTypename: "InviteUserToGroupResult" }
  );

  expect(result.invite.role).toBe("Member");
});

test("no auth", async () => {
  await prepareGroup();
  await unsetCurrentUser();
  const result = await executeCommonOperation(
    graphql(/* GraphQL */ `
      mutation NoAuthInviteTest {
        result: inviteUserToGroup(
          input: { group: "testgroup", username: "mockmember", role: Member }
        ) {
          __typename
          ... on BaseError {
            message
          }
        }
      }
    `),
    { expectedTypename: "BaseError" }
  );

  expect(result.message).toMatch("Not authorized");
});

test("invite to another's group", async () => {
  await prepareGroup();
  await setCurrentUser(memberUser);
  const result = await executeCommonOperation(
    graphql(/* GraphQL */ `
      mutation NoAuthInviteTest {
        result: inviteUserToGroup(
          input: { group: "testgroup", username: "mockmember", role: Member }
        ) {
          __typename
          ... on BaseError {
            message
          }
        }
      }
    `),
    { expectedTypename: "BaseError" }
  );

  expect(result.message).toMatch("Not authorized");
});
