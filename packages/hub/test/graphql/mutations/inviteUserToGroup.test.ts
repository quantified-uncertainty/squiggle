import { graphql } from "../../gql-gen";
import { commonTestMutations } from "../commonQueries";
import { createRunners, setCurrentUser, unsetCurrentUser } from "../helpers";

const ownerUser = "mockowner";
const memberUser = "mockmember";

async function prepareGroup() {
  await setCurrentUser(ownerUser);
  await commonTestMutations.createGroup("testgroup");
}

const { runOk, runError } = createRunners(
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
  "InviteUserToGroupResult"
);

test("basic invite", async () => {
  await prepareGroup();
  await setCurrentUser(memberUser);
  await setCurrentUser(ownerUser);
  const result = await runOk({});
  expect(result.invite.role).toBe("Member");
});

test("no auth", async () => {
  await prepareGroup();
  await unsetCurrentUser();

  const result = await runError({}, "BaseError");
  expect(result.message).toMatch("Not authorized");
});

test("invite to another's group", async () => {
  await prepareGroup();
  await setCurrentUser(memberUser);

  const result = await runError({}, "BaseError");
  expect(result.message).toMatch("You're not a member of testgroup group");
});
