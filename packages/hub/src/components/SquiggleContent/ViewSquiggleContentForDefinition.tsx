import { FC } from "react";
import { graphql } from "relay-runtime";
import { useFragment } from "react-relay";

import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { ViewSquiggleContentForDefinition$key } from "@/__generated__/ViewSquiggleContentForDefinition.graphql";

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
          ... on RelativeValuesDefinition {
            items {
              id
            }
          }
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

  switch (forDefinition.definition.currentRevision.content.__typename) {
    case "RelativeValuesDefinition":
      return <div>TODO - RV UI</div>;
    default:
      return <div>ERROR - unknown definition type</div>;
  }
};
