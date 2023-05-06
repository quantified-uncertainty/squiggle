import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelViewQuery } from "@gen/ModelViewQuery.graphql";
import { SquigglePlayground } from "@quri/squiggle-components";

const ModelViewQuery = graphql`
  query ModelViewQuery($input: QueryModelInput!) {
    model(input: $input) {
      owner {
        username
      }
      content {
        __typename
        ... on SquiggleSnippet {
          code
        }
      }
    }
  }
`;

export const ModelView: FC<{ username: string; slug: string }> = ({
  username,
  slug,
}) => {
  const data = useLazyLoadQuery<ModelViewQuery>(ModelViewQuery, {
    input: { ownerUsername: username, slug },
  });

  const typename = data.model.content.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }
  return <SquigglePlayground code={data.model.content.code} />;
};
