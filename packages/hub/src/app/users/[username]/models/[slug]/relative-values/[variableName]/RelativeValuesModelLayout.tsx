"use client";

import { FC, PropsWithChildren, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useFragment } from "react-relay";

import { result } from "@quri/squiggle-lang";
import {
  Bars4Icon,
  LinkIcon,
  ScaleIcon,
  ScatterPlotIcon,
  TableCellsIcon,
} from "@quri/ui";

import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { StyledLink } from "@/components/ui/StyledLink";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { RelativeValuesProvider } from "@/relative-values/components/views/RelativeValuesProvider";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import {
  modelForRelativeValuesExportRoute,
  relativeValuesRoute,
} from "@/routes";
import { SquiggleContentFragment } from "@/squiggle/components/SquiggleContent";
import {
  ModelPageFragment,
  PreloadedModelPageQuery,
  useModelPageQuery,
} from "../../ModelPage";
import { ModelRevisionFragment } from "../../ModelRevision";
import { CacheMenu } from "./CacheMenu";

export const RelativeValuesModelLayout: FC<
  PropsWithChildren<{
    query: PreloadedModelPageQuery;
    variableName: string;
  }>
> = ({ query, variableName, children }) => {
  const modelRef = useModelPageQuery(query);
  const model = useFragment<ModelPage$key>(ModelPageFragment, modelRef);
  const revision = useFragment<ModelRevision$key>(
    ModelRevisionFragment,
    model.currentRevision
  );

  const content = useFragment<SquiggleContent$key>(
    SquiggleContentFragment,
    revision.content
  );

  if (!revision.forRelativeValues) {
    throw new Error("Not found");
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
        username: definition.owner.username,
        slug: definition.slug,
      })}
    >
      <LinkIcon className="mr-1 opacity-50" size={18} />
      <span className="font-mono">{`${definition.owner.username}/${definition.slug}`}</span>
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
          <CacheMenu revision={revision} ownerUsername={model.owner.username} />
          <StyledTabLink.List>
            <StyledTabLink
              name="List"
              icon={Bars4Icon}
              href={modelForRelativeValuesExportRoute({
                username: model.owner.username,
                slug: model.slug,
                variableName,
              })}
            />
            <StyledTabLink
              name="Grid"
              icon={TableCellsIcon}
              href={modelForRelativeValuesExportRoute({
                username: model.owner.username,
                slug: model.slug,
                variableName,
                mode: "grid",
              })}
            />
            <StyledTabLink
              name="Plot"
              icon={ScatterPlotIcon}
              href={modelForRelativeValuesExportRoute({
                username: model.owner.username,
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
