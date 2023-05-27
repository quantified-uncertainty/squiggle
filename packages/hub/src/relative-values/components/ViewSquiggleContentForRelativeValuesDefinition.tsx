"use client";

import { FC, useMemo } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { ViewSquiggleContentForRelativeValuesDefinition$key } from "@/__generated__/ViewSquiggleContentForRelativeValuesDefinition.graphql";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { RelativeValuesProvider } from "@/relative-values/components/views/RelativeValuesProvider";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { SquiggleContentFragment } from "@/squiggle/components/SquiggleContent";
import { ListView } from "./views/ListView";

const DefinitionFragment = graphql`
  fragment ViewSquiggleContentForRelativeValuesDefinition on RelativeValuesDefinitionRevision {
    items {
      id
      name
      description
      clusterId
    }
    clusters {
      id
      color
      recommendedUnit
    }
    recommendedUnit
  }
`;

type Props = {
  contentRef: SquiggleContent$key;
  definitionRef: ViewSquiggleContentForRelativeValuesDefinition$key;
};

export const ViewSquiggleContentForRelativeValuesDefinition: FC<Props> = ({
  contentRef,
  definitionRef,
}) => {
  const content = useFragment(SquiggleContentFragment, contentRef);
  const definition = useFragment(DefinitionFragment, definitionRef);

  const evaluatorResult = useMemo(
    () => ModelEvaluator.create(content.code),
    [content.code]
  );

  if (!evaluatorResult.ok) {
    return <div>Error: {evaluatorResult.value}</div>;
  }

  const evaluator = evaluatorResult.value;

  return (
    <RelativeValuesProvider definition={definition} evaluator={evaluator}>
      <div className="mb-8 flex items-center justify-between max-w-6xl mx-auto">
        <StyledTabLink.List>
          <StyledTabLink name="List" href="/TODO" />
          <StyledTabLink name="Grid" href="/TODO" />
          <StyledTabLink name="Plot" href="/TODO" />
        </StyledTabLink.List>
      </div>
      <div>
        <ListView model={evaluator} />
      </div>
    </RelativeValuesProvider>
  );
};
