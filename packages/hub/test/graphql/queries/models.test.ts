import { graphql } from "../../gql-gen";
import { executeOperation } from "../executor";

test("empty", async () => {
  const { models } = await executeOperation(
    graphql(/* GraphQL */ `
      query TestModels {
        models {
          edges {
            node {
              slug
            }
          }
        }
      }
    `)
  );

  expect(models.edges.length).toBe(0);
});
