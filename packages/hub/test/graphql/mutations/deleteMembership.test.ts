import { graphql } from "../../gql-gen";
import { MembershipRole } from "../../gql-gen/graphql";
import { commonTestMutations, commonTestQueries } from "../commonQueries";
import { createRunners, setCurrentUser } from "../helpers";

const { runOk, runError } = createRunners(
  graphql(/* GraphQL */ `
    mutation DeleteMembershipTest($group: String!, $user: String!) {
      result: deleteMembership(input: { group: $group, user: $user }) {
        __typename
        ... on BaseError {
          message
        }
        ... on DeleteMembershipResult {
          ok
        }
      }
    }
  `),
  "DeleteMembershipResult"
);

async function commonConfiguration() {
  const group = "testgroup";
  const admin = "mockadmin";
  await setCurrentUser(admin);
  await setCurrentUser("mockadmin2");
  await setCurrentUser("mockuser");
  await setCurrentUser("mockuser2");

  await setCurrentUser(admin);
  await commonTestMutations.createGroup(group);

  await commonTestMutations.addMember({
    group,
    admin,
    user: "mockuser",
    role: MembershipRole.Member,
  });
  await commonTestMutations.addMember({
    group,
    admin,
    user: "mockuser2",
    role: MembershipRole.Member,
  });
  await commonTestMutations.addMember({
    group,
    admin,
    user: "mockadmin2",
    role: MembershipRole.Admin,
  });
}

test("member deletes self", async () => {
  await commonConfiguration();

  // sanity check
  expect(
    (await commonTestQueries.memberships("testgroup"))
      .map((m) => m.user.slug)
      .sort()
  ).toEqual(["mockadmin", "mockadmin2", "mockuser", "mockuser2"].sort());

  await setCurrentUser("mockuser");

  const result = await runOk({
    group: "testgroup",
    user: "mockuser",
  });
  expect(result.ok).toBe(true);

  expect(
    (await commonTestQueries.memberships("testgroup"))
      .map((m) => m.user.slug)
      .sort()
  ).toEqual(["mockadmin", "mockadmin2", "mockuser2"].sort());
});

test("admin deletes member", async () => {
  await commonConfiguration();

  await setCurrentUser("mockadmin");

  const result = await runOk({
    group: "testgroup",
    user: "mockuser",
  });
  expect(result.ok).toBe(true);

  expect(
    (await commonTestQueries.memberships("testgroup"))
      .map((m) => m.user.slug)
      .sort()
  ).toEqual(["mockadmin", "mockadmin2", "mockuser2"].sort());
});

test("member can't delete admin", async () => {
  await commonConfiguration();

  await setCurrentUser("mockuser");

  const result = await runError(
    {
      group: "testgroup",
      user: "mockadmin",
    },
    "BaseError"
  );
  expect(result.message).toBe("Only admins can delete other members");

  expect(
    (await commonTestQueries.memberships("testgroup"))
      .map((m) => m.user.slug)
      .sort()
  ).toEqual(["mockadmin", "mockadmin2", "mockuser", "mockuser2"].sort());
});

test("no such member", async () => {
  await commonConfiguration();

  await setCurrentUser("another-user");
  await setCurrentUser("mockadmin");

  const result = await runError(
    {
      group: "testgroup",
      user: "another-user",
    },
    "BaseError"
  );
  expect(result.message).toBe("another-user is not a member of testgroup");
});

test("not signed in", async () => {
  await commonConfiguration();
  const result = await runError(
    { group: "testgroup", user: "mockadmin" },
    "BaseError"
  );
  expect(result.message).toMatch("Not authorized");
});

test("not a member", async () => {
  await commonConfiguration();
  await setCurrentUser("another-user");
  const result = await runError(
    { group: "testgroup", user: "mockadmin" },
    "BaseError"
  );
  expect(result.message).toBe("You're not a member of this group");
});

test("delete self as last user", async () => {
  await setCurrentUser("mockuser");
  await commonTestMutations.createGroup("testgroup");
  const result = await runError(
    { group: "testgroup", user: "mockuser" },
    "BaseError"
  );
  expect(result.message).toBe(
    "Can't delete, mockuser is the last admin of testgroup"
  );
});
