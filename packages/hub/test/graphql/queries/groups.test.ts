import { graphql } from "../../gql-gen";
import { commonTestMutations } from "../commonQueries";
import { createRunners, setCurrentUser, unsetCurrentUser } from "../helpers";

const { runOk, runError } = createRunners(
  graphql(/* GraphQL */ `
    query TestGroups($input: GroupsQueryInput!) {
      result: groups(first: 10, input: $input) {
        __typename
        edges {
          node {
            id
            slug
          }
        }
      }
    }
  `),
  "QueryGroupsConnection"
);

test("list groups", async () => {
  await setCurrentUser("mockuser");
  await commonTestMutations.createGroup("group1");
  await commonTestMutations.createGroup("group2");
  await commonTestMutations.createGroup("group3");
  const result = await runOk({ input: {} });

  expect(result.edges.length).toEqual(3);
});

test("slugContains", async () => {
  await setCurrentUser("mockuser");
  await commonTestMutations.createGroup("foo-bar");
  await commonTestMutations.createGroup("foo-baz");
  await commonTestMutations.createGroup("bar-baz");
  const result = await runOk({ input: { slugContains: "bar" } });

  expect(result.edges.length).toEqual(2);
  expect(result.edges.map((e) => e.node.slug).sort()).toEqual(
    ["foo-bar", "bar-baz"].sort()
  );
});

test("myOnly", async () => {
  await setCurrentUser("user1");
  await commonTestMutations.createGroup("group1");
  await commonTestMutations.createGroup("group4");

  await setCurrentUser("user2");
  await commonTestMutations.createGroup("group2");
  await commonTestMutations.createGroup("group3");

  const result2 = await runOk({ input: { myOnly: true } });

  expect(result2.edges.length).toEqual(2);
  expect(result2.edges.map((e) => e.node.slug).sort()).toEqual(
    ["group2", "group3"].sort()
  );

  await setCurrentUser("user1");
  const result1 = await runOk({ input: { myOnly: true } });
  expect(result1.edges.length).toEqual(2);
  expect(result1.edges.map((e) => e.node.slug).sort()).toEqual(
    ["group1", "group4"].sort()
  );
});

test("myOnly not signed in", async () => {
  await setCurrentUser("user1");
  await commonTestMutations.createGroup("group1");
  await commonTestMutations.createGroup("group4");
  await unsetCurrentUser();
  const result = await runOk({ input: { myOnly: true } });
  expect(result.edges.length).toEqual(0);
});
