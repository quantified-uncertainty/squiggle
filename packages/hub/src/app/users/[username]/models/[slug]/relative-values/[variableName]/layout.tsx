"use client";

import { ReactNode, useMemo } from "react";
import { useFragment } from "react-relay";

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

  const evaluatorResult = useMemo(
    () =>
      ModelEvaluator.create(content.code, revision.forRelativeValues?.cache),
    [content.code, revision.forRelativeValues]
  );

  if (!evaluatorResult.ok) {
    return <div>Error: {evaluatorResult.value}</div>;
  }

  const evaluator = evaluatorResult.value;

  return (
    <ViewModelRevision
      revisionRef={model.currentRevision}
      modelUsername={params.username}
      modelSlug={params.slug}
    >
      <div className="mb-8 flex items-center gap-4">
        <StyledTabLink.List>
          <StyledTabLink
            name="List"
            href={modelForRelativeValuesExportRoute({
              username: params.username,
              slug: params.slug,
              variableName: params.variableName,
            })}
          />
          <StyledTabLink
            name="Grid"
            href={modelForRelativeValuesExportRoute({
              username: params.username,
              slug: params.slug,
              variableName: params.variableName,
              mode: "grid",
            })}
          />
          <StyledTabLink
            name="Plot"
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
      <RelativeValuesProvider definition={definition} evaluator={evaluator}>
        {children}
      </RelativeValuesProvider>
    </ViewModelRevision>
  );
}
