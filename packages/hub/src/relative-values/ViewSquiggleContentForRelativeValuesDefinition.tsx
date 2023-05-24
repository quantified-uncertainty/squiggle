"use client";

import { FC, useMemo } from "react";

import { ViewSquiggleContentForRelativeValuesDefinition$key } from "@/__generated__/ViewSquiggleContentForRelativeValuesDefinition.graphql";
import { RelativeValuesProvider } from "@/relative-values/components/View/RelativeValuesProvider";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";
import { ListView } from "./components/View/ListView";

const DefinitionFragment = graphql`
  fragment ViewSquiggleContentForRelativeValuesDefinition on RelativeValuesDefinition {
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
  code: string;
  definitionRef: ViewSquiggleContentForRelativeValuesDefinition$key;
};

export const ViewSquiggleContentForRelativeValuesDefinition: FC<Props> = ({
  code,
  definitionRef,
}) => {
  const definition = useFragment(DefinitionFragment, definitionRef);

  const evaluatorResult = useMemo(() => ModelEvaluator.create(code), [code]);

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
