"use client";

import { ReactNode, useEffect, useState } from "react";
import { useFragment } from "react-relay";
import Skeleton from "react-loading-skeleton";

import { result } from "@quri/squiggle-lang";

import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { RelativeValuesProvider } from "@/relative-values/components/views/RelativeValuesProvider";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { modelForRelativeValuesExportRoute } from "@/routes";
import { SquiggleContentFragment } from "@/squiggle/components/SquiggleContent";
import { ModelPageFragment, useModelPageQuery } from "../../ModelPage";
import { ModelRevisionFragment } from "../../ModelRevision";
import { ViewModelRevision } from "../../ViewModelRevision";
import { CacheMenu } from "./CacheMenu";
import { BarChartIcon } from "@quri/ui";
import { Bars4Icon } from "@quri/ui";
import { ListBulletIcon } from "@quri/ui";
import { TableCellsIcon } from "@quri/ui";
import { ScatterPlotIcon } from "@quri/ui";

export default function RelativeValuesModelLayout({
  params,
  children,
}: {
  params: { username: string; slug: string; variableName: string };
  children: ReactNode;
}) {
  const modelRef = useModelPageQuery(
    {
      ownerUsername: params.username,
      slug: params.slug,
    },
    {
      variableName: params.variableName,
    }
  );

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

  const definition = useFragment<RelativeValuesDefinitionRevision$key>(
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
        definition={definition}
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

  return (
    <ViewModelRevision
      revisionRef={model.currentRevision}
      modelUsername={params.username}
      modelSlug={params.slug}
    >
      <div className="mb-8 flex items-center gap-4">
        <div className="">{params.variableName}</div>
        <StyledTabLink.List>
          <StyledTabLink
            name="List"
            icon={Bars4Icon}
            href={modelForRelativeValuesExportRoute({
              username: params.username,
              slug: params.slug,
              variableName: params.variableName,
            })}
          />
          <StyledTabLink
            name="Grid"
            icon={TableCellsIcon}
            href={modelForRelativeValuesExportRoute({
              username: params.username,
              slug: params.slug,
              variableName: params.variableName,
              mode: "grid",
            })}
          />
          <StyledTabLink
            name="Plot"
            icon={ScatterPlotIcon}
            href={modelForRelativeValuesExportRoute({
              username: params.username,
              slug: params.slug,
              variableName: params.variableName,
              mode: "plot",
            })}
          />
        </StyledTabLink.List>
        <CacheMenu revision={revision} />
      </div>
      {body}
    </ViewModelRevision>
  );
}
