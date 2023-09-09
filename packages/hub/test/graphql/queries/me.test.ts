import { graphql } from "../../gql-gen";
import { executeOperation, setCurrentUserObject } from "../helpers";

test("basic", async () => {
  await setCurrentUserObject({
    email: "mock@example.com",
    username: "mockuser",
  });
  const { me } = await executeOperation(
    graphql(/* GraphQL */ `
      query TestMe {
        me {
          __typename
          email
          username
        }
      }
    `)
  );

  expect(me.email).toBe("mock@example.com");
  expect(me.username).toBe("mockuser");
});
