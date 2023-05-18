import { FC } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelViewQuery } from "@gen/ModelViewQuery.graphql";
import { SquiggleSnippetForm } from "./SquiggleSnippetForm";

const ModelViewQuery = graphql`
  query ModelViewQuery($input: QueryModelInput!) {
    model(input: $input) {
      id
      currentRevision {
        content {
          __typename
          ...SquiggleSnippetFormFragment
        }
      }
    }
  }
`;

type Props = {
  username: string;
  slug: string;
};

export const ModelView: FC<Props> = ({ username, slug }) => {
  const data = useLazyLoadQuery<ModelViewQuery>(ModelViewQuery, {
    input: { ownerUsername: username, slug },
  });

  const typename = data.model.currentRevision.content.__typename;
  if (typename !== "SquiggleSnippet") {
    return <div>Unknown model type {typename}</div>;
  }

  return (
    <SquiggleSnippetForm
      username={username}
      slug={slug}
      content={data.model.currentRevision.content}
    />
  );
};
