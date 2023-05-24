import { FC } from "react";
import { graphql } from "relay-runtime";
import { useFragment } from "react-relay";

import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { ViewSquiggleContentForDefinition$key } from "@/__generated__/ViewSquiggleContentForDefinition.graphql";
import { SquiggleContentFragment } from "./SquiggleContent";
import { ViewSquiggleContentForRelativeValuesDefinition } from "@/relative-values/ViewSquiggleContentForRelativeValuesDefinition";

type Props = {
  contentRef: SquiggleContent$key;
  definitionRef: ViewSquiggleContentForDefinition$key;
};

const fragment = graphql`
  fragment ViewSquiggleContentForDefinition on ModelRevisionForDefinition {
    definition {
      id
      currentRevision {
        content {
          __typename
          ...ViewSquiggleContentForRelativeValuesDefinition
        }
      }
    }
    variable
  }
`;

export const ViewSquiggleContentForDefinition: FC<Props> = ({
  contentRef,
  definitionRef,
}) => {
  const forDefinition = useFragment(fragment, definitionRef);

  const content = useFragment(SquiggleContentFragment, contentRef);

  switch (forDefinition.definition.currentRevision.content.__typename) {
    case "RelativeValuesDefinition":
      return (
        <ViewSquiggleContentForRelativeValuesDefinition
          definitionRef={forDefinition.definition.currentRevision.content}
          code={content.code}
        />
      );
    default:
      return <div>ERROR - unknown definition type</div>;
  }
};
