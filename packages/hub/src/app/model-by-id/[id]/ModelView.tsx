import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelViewQuery } from "@gen/ModelViewQuery.graphql";
import { SquigglePlayground } from "@quri/squiggle-components";

const ModelViewQuery = graphql`
  query ModelViewQuery($id: String!) {
    model(id: $id) {
      content {
        __typename
        ... on SquiggleSnippet {
          code
        }
      }
    }
  }
`;

export const ModelView: FC<{ id: string }> = ({ id }) => {
  const data = useLazyLoadQuery<ModelViewQuery>(ModelViewQuery, { id });

  const typename = data.model.content.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }
  return <SquigglePlayground code={data.model.content.code} />;
};
