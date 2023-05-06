import { FC } from "react";
import { useFragment } from "react-relay";

import { graphql } from "relay-runtime";

import type { ModelCardFragment$key } from "@gen/ModelCardFragment.graphql";
import { StyledLink } from "@/components/ui/StyledLink";

const Fragment = graphql`
  fragment ModelCardFragment on Model {
    dbId
    content {
      __typename
      ... on SquiggleSnippet {
        code
      }
    }
  }
`;

export const ModelCard: FC<{
  model: ModelCardFragment$key;
}> = ({ model }) => {
  const data = useFragment(Fragment, model);

  switch (data.content.__typename) {
    case "SquiggleSnippet":
      return (
        <div>
          <StyledLink href={`/model-by-id/${data.dbId}`}>
            {data.dbId}
          </StyledLink>
          <div className="font-mono">{data.content.code}</div>
        </div>
      );
    default:
      return <div>Unknown model type {data.content.__typename}</div>;
  }
};
