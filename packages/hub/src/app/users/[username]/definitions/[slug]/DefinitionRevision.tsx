import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { DefinitionRevision$key } from "@/__generated__/DefinitionRevision.graphql";
import { RelativeValuesDefinition } from "@/components/RelativeValuesDefinition";

export const DefinitionRevisionFragment = graphql`
  fragment DefinitionRevision on DefinitionRevision {
    content {
      __typename
      ...RelativeValuesDefinition
    }
  }
`;

type Props = {
  dataRef: DefinitionRevision$key;
};

export const DefinitionRevision: FC<Props> = ({ dataRef }) => {
  const revision = useFragment(DefinitionRevisionFragment, dataRef);
  const typename = revision.content.__typename;

  switch (typename) {
    case "RelativeValuesDefinition":
      return <RelativeValuesDefinition definitionRef={revision.content} />;
    default:
      return <div>Unknown definition type {typename}</div>;
  }
};
