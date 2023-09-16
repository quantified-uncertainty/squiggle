import { graphql } from "../../gql-gen";
import { MembershipRole } from "../../gql-gen/graphql";
import { commonTestMutations } from "../commonQueries";
import {
  createInputRunners,
  createRunners,
  setCurrentUser,
  unsetCurrentUser,
} from "../helpers";

const ownerUser = "mockowner";
const memberUser = "mockmember";

async function prepareGroup() {
  await setCurrentUser(ownerUser);
  await commonTestMutations.createGroup("testgroup");
}

const { runOk, runError } = createInputRunners(
  graphql(/* GraphQL */ `
    mutation InviteTest($input: MutationInviteUserToGroupInput!) {
      result: inviteUserToGroup(input: $input) {
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
  await setCurrentUser(memberUser); // create a user
  await setCurrentUser(ownerUser);
  const result = await runOk({
    group: "testgroup",
    username: "mockmember",
    role: MembershipRole.Member,
  });
  expect(result.invite.role).toBe("Member");
});

test("no auth", async () => {
  await prepareGroup();
  await unsetCurrentUser();

  const result = await runError(
    {
      group: "testgroup",
      username: "mockmember",
      role: MembershipRole.Member,
    },
    "BaseError"
  );
  expect(result.message).toMatch("Not authorized");
});

test("invite to another's group", async () => {
  await prepareGroup();
  await setCurrentUser(memberUser);

  const result = await runError(
    {
      group: "testgroup",
      username: "mockmember",
      role: MembershipRole.Member,
    },
    "BaseError"
  );
  expect(result.message).toMatch("You're not a member of testgroup group");
});

test("invite to nonexistent group", async () => {
  await prepareGroup();
  await setCurrentUser(memberUser); // create a user
  await setCurrentUser(ownerUser);

  const result = await runError(
    {
      group: "nosuchgroup",
      username: "mockmember",
      role: MembershipRole.Member,
    },
    "BaseError"
  );
  expect(result.message).toMatch("Group nosuchgroup not found");
});

test("invite nonexistent user", async () => {
  await prepareGroup();
  await setCurrentUser(ownerUser);

  const result = await runError(
    {
      group: "testgroup",
      username: "nosuchuser",
      role: MembershipRole.Member,
    },
    "BaseError"
  );
  expect(result.message).toMatch("Invited user nosuchuser not found");
});

test("existing invite", async () => {
  await prepareGroup();
  await setCurrentUser(memberUser); // create a user
  await setCurrentUser(ownerUser);

  await runOk({
    group: "testgroup",
    username: memberUser,
    role: MembershipRole.Member,
  });
  const result = await runError(
    {
      group: "testgroup",
      username: memberUser,
      role: MembershipRole.Member,
    },
    "BaseError"
  );
  expect(result.message).toMatch(
    "There's already a pending invite for mockmember to join testgroup"
  );
});

test("already a member", async () => {
  await prepareGroup();
  await setCurrentUser(memberUser);
  await setCurrentUser(ownerUser);
  await commonTestMutations.addMember({
    group: "testgroup",
    admin: ownerUser,
    user: memberUser,
    role: MembershipRole.Member,
  });

  await setCurrentUser(ownerUser);
  const result = await runError(
    {
      group: "testgroup",
      username: memberUser,
      role: MembershipRole.Member,
    },
    "BaseError"
  );
  expect(result.message).toMatch("mockmember is already a member of testgroup");
});
