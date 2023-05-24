import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { RelativeValuesDefinitionFragment$key } from "@/__generated__/RelativeValuesDefinitionFragment.graphql";

const Fragment = graphql`
  fragment RelativeValuesDefinitionFragment on Definition {
    id
    slug
    owner {
      username
    }
    currentRevision {
      content {
        __typename
        ... on RelativeValuesDefinition {
          title
          items {
            id
          }
        }
      }
    }
  }
`;

type Props = {
  definitionRef: RelativeValuesDefinitionFragment$key;
  mode: "view" | "edit";
};

export const RelativeValuesDefinition: FC<Props> = ({
  definitionRef,
  mode,
}) => {
  const definition = useFragment(Fragment, definitionRef);

  if (
    definition.currentRevision.content.__typename !== "RelativeValuesDefinition"
  ) {
    // shouldn't happen, typename is validated by DefinitionContent
    throw new Error("Internal error");
  }

  const { content } = definition.currentRevision;

  return (
    <div className="max-w-2xl mx-auto">
      <header className="text-xl font-bold">{content.title}</header>
      {content.items.map((item) => (
        <div key={item.id}>{item.id}</div>
      ))}
    </div>
  );
};
