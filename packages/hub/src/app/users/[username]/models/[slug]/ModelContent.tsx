import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { ModelContent$key } from "@/__generated__/ModelContent.graphql";
import { SquiggleSnippetContent } from "@/components/SquiggleSnippetContent/SquiggleSnippetContent";

const Fragment = graphql`
  fragment ModelContent on Model {
    currentRevision {
      content {
        __typename
      }
    }
    ...SquiggleSnippetContentFragment
  }
`;

type Props = {
  model: ModelContent$key;
  mode: "view" | "edit";
};

export const ModelContent: FC<Props> = ({ model, mode }) => {
  const data = useFragment(Fragment, model);
  const typename = data.currentRevision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return <SquiggleSnippetContent model={data} mode={mode} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
