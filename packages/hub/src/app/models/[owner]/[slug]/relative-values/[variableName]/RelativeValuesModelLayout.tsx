"use client";

import { FC, PropsWithChildren, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { graphql, useFragment } from "react-relay";

import { result } from "@quri/squiggle-lang";
import {
  Bars4Icon,
  LinkIcon,
  ScaleIcon,
  ScatterPlotIcon,
  TableCellsIcon,
} from "@quri/ui";

import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { RelativeValuesModelLayoutQuery } from "@/__generated__/RelativeValuesModelLayoutQuery.graphql";
import { RelativeValuesModelRevision$key } from "@/__generated__/RelativeValuesModelRevision.graphql";
import { StyledLink } from "@/components/ui/StyledLink";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { RelativeValuesProvider } from "@/relative-values/components/views/RelativeValuesProvider";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import {
  modelForRelativeValuesExportRoute,
  relativeValuesRoute,
} from "@/routes";
import { CacheMenu } from "./CacheMenu";
import { RelativeValuesModelRevisionFragment } from "./RelativeValuesModelRevision";
import { notFound } from "next/navigation";

export const RelativeValuesModelLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<RelativeValuesModelLayoutQuery>;
    variableName: string;
  }>
> = ({ query, variableName, children }) => {
  const [{ model: result }] = usePageQuery(
    graphql`
      # used in ModelEvaluator
      query RelativeValuesModelLayoutQuery(
        $input: QueryModelInput!
        $forRelativeValues: ModelRevisionForRelativeValuesInput!
      ) {
        model(input: $input) {
          __typename
          ... on Model {
            id
            slug
            isEditable
            ...EditModelExports_Model
            owner {
              slug
            }
            currentRevision {
              content {
                __typename
              }
              ...RelativeValuesModelRevision
            }
          }
        }
      }
    `,
    query
  );
  const model = extractFromGraphqlErrorUnion(result, "Model");
  const revision = useFragment<RelativeValuesModelRevision$key>(
    RelativeValuesModelRevisionFragment,
    model.currentRevision
  );

  const content = extractFromGraphqlErrorUnion(
    revision.content,
    "SquiggleSnippet"
  );

  if (!revision.forRelativeValues) {
    notFound();
  }

  const definition = revision.forRelativeValues.definition;

  const definitionRevision = useFragment<RelativeValuesDefinitionRevision$key>(
    RelativeValuesDefinitionRevisionFragment,
    revision.forRelativeValues.definition.currentRevision
  );

  const [evaluatorResult, setEvaluatorResult] = useState<
    result<ModelEvaluator, string> | undefined
  >();

  useEffect(() => {
    // ModelEvaluator.create is async because SqProject.run is async
    ModelEvaluator.create(content.code, revision.forRelativeValues?.cache).then(
      setEvaluatorResult
    );
  }, [content.code, revision.forRelativeValues]);

  const body = evaluatorResult ? (
    evaluatorResult.ok ? (
      <RelativeValuesProvider
        definition={definitionRevision}
        evaluator={evaluatorResult.value}
      >
        {children}
      </RelativeValuesProvider>
    ) : (
      <div>Error: {evaluatorResult.value}</div>
    )
  ) : (
    <Skeleton height={256} />
  );

  const definitionLink = (
    <StyledLink
      className="flex items-center text-sm"
      href={relativeValuesRoute({
        owner: definition.owner.slug,
        slug: definition.slug,
      })}
    >
      <LinkIcon className="mr-1 opacity-50" size={18} />
      <span className="font-mono">{`${definition.owner.slug}/${definition.slug}`}</span>
    </StyledLink>
  );

  return (
    <div className="py-4 px-8">
      <div className="mb-6 py-2 px-2 flex justify-between">
        <div className="flex items-center">
          <ScaleIcon className="text-gray-700 mr-2 opacity-40" size={22} />
          <div className="flex text-md font-mono font-bold text-gray-700">
            {variableName}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {definitionLink}
          <CacheMenu revision={revision} isEditable={model.isEditable} />
          <StyledTabLink.List>
            <StyledTabLink
              name="List"
              icon={Bars4Icon}
              href={modelForRelativeValuesExportRoute({
                owner: model.owner.slug,
                slug: model.slug,
                variableName,
              })}
            />
            <StyledTabLink
              name="Grid"
              icon={TableCellsIcon}
              href={modelForRelativeValuesExportRoute({
                owner: model.owner.slug,
                slug: model.slug,
                variableName,
                mode: "grid",
              })}
            />
            <StyledTabLink
              name="Plot"
              icon={ScatterPlotIcon}
              href={modelForRelativeValuesExportRoute({
                owner: model.owner.slug,
                slug: model.slug,
                variableName,
                mode: "plot",
              })}
            />
          </StyledTabLink.List>
        </div>
      </div>
      {body}
    </div>
  );
};
