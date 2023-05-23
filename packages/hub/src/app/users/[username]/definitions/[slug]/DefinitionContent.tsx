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
  definitionRef: DefinitionContent$key;
  mode: "view" | "edit";
};

export const DefinitionContent: FC<Props> = ({ definitionRef, mode }) => {
  const definition = useFragment(Fragment, definitionRef);
  const typename = definition.currentRevision.content.__typename;

  switch (typename) {
    case "RelativeValuesDefinition":
      return (
        <RelativeValuesDefinition definitionRef={definition} mode={mode} />
      );
    default:
      return <div>Unknown definition type {typename}</div>;
  }
};
