import { DefinitionContent$key } from "@/__generated__/DefinitionContent.graphql";
import { RelativeValuesDefinition } from "@/components/SquiggleSnippetContent/RelativeValuesDefinition";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";

const Fragment = graphql`
  fragment DefinitionContent on Definition {
    currentRevision {
      content {
        __typename
      }
    }
    ...RelativeValuesDefinitionFragment
  }
`;

type Props = {
  definition: DefinitionContent$key;
  mode: "view" | "edit";
};

export const DefinitionContent: FC<Props> = ({ definition, mode }) => {
  const data = useFragment(Fragment, definition);
  const typename = data.currentRevision.content.__typename;

  switch (typename) {
    case "RelativeValuesDefinition":
      return <RelativeValuesDefinition definition={data} mode={mode} />;
    default:
      return <div>Unknown definition type {typename}</div>;
  }
};
