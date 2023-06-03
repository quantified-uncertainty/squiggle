import { FC } from "react";
import { graphql } from "relay-runtime";

import { SquiggleSnippetContentFragment$key } from "@/__generated__/SquiggleSnippetContentFragment.graphql";
import { EditSquiggleSnippetContent } from "./EditSquiggleSnippetContent";
import { ViewSquiggleSnippetContent } from "./ViewSquiggleSnippetContent";

export const Fragment = graphql`
  fragment SquiggleSnippetContentFragment on Model {
    id
    slug
    owner {
      username
    }
    currentRevision {
      description
      content {
        __typename
        ... on SquiggleSnippet {
          code
        }
      }
    }
  }
`;

type Props = {
  model: SquiggleSnippetContentFragment$key;
  mode: "view" | "edit";
};

export const SquiggleSnippetContent: FC<Props> = ({ model, mode }) => {
  if (mode === "edit") {
    return <EditSquiggleSnippetContent model={model} />;
  } else {
    return <ViewSquiggleSnippetContent model={model} />;
  }
};
