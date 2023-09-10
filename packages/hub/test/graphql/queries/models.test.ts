import { graphql } from "../../gql-gen";
import {
  executeCommonOperation,
  executeOperation,
  setCurrentUser,
  unsetCurrentUser,
} from "../helpers";

const Query = graphql(/* GraphQL */ `
  query TestModels {
    models {
      edges {
        node {
          slug
          isEditable
          isPrivate
          owner {
            __typename
            slug
          }
        }
      }
    }
  }
`);

const CreateModel = graphql(/* GraphQL */ `
  mutation TestModels_createModel(
    $input: MutationCreateSquiggleSnippetModelInput!
  ) {
    result: createSquiggleSnippetModel(input: $input) {
      __typename
    }
  }
`);

test("empty", async () => {
  const { models } = await executeOperation(Query);
  expect(models.edges.length).toBe(0);
});

const user = "mockuser";

async function createModel(slug: string, options: { private?: boolean } = {}) {
  await executeCommonOperation(CreateModel, {
    variables: {
      input: {
        code: "2+2",
        slug,
        ...(options.private ? { isPrivate: true } : {}),
      },
    },
    expectedTypename: "CreateSquiggleSnippetModelResult",
  });
}

test("list models", async () => {
  await setCurrentUser(user);
  await createModel("model1");
  await createModel("model2");
  await createModel("model3");
  const { models } = await executeOperation(Query);

  expect(models.edges.length).toBe(3);
});

test("default limit", async () => {
  await setCurrentUser(user);
  for (let i = 0; i < 30; i++) {
    await createModel(`model${i}`);
  }
  const { models } = await executeOperation(Query);

  expect(models.edges.length).toBe(20);
});

test("list private models", async () => {
  await setCurrentUser(user);
  await createModel("model1");
  await createModel("model2");
  await createModel("model3", { private: true });
  const { models } = await executeOperation(Query);

  expect(models.edges.map((edge) => edge.node.slug)).toEqual([
    "model3",
    "model2",
    "model1",
  ]);
});

test("hide private models from anon users", async () => {
  await setCurrentUser(user);
  await createModel("model1");
  await createModel("model2", { private: true });
  await createModel("model3");
  unsetCurrentUser();
  const { models } = await executeOperation(Query);

  expect(models.edges.length).toBe(2);
  expect(models.edges.map((edge) => edge.node.slug)).toEqual([
    "model3",
    "model1",
  ]);
});

test("hide private models from other users", async () => {
  await setCurrentUser(user);
  await createModel("model1");
  await createModel("model2", { private: true });
  await createModel("model3");
  await setCurrentUser("otheruser");
  const { models } = await executeOperation(Query);

  expect(models.edges.length).toBe(2);
  expect(models.edges.map((edge) => edge.node.slug)).toEqual([
    "model3",
    "model1",
  ]);
});
