"use client";

import { FC, PropsWithChildren, useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { serializeSourceId } from "@quri/hub-linker";
import { result } from "@quri/squiggle-lang";
import {
  ModelEvaluator,
  RelativeValuesProvider,
} from "@quri/squiggle-relative-values";
import { getPlaygroundUrl } from "@quri/versioned-squiggle-components";

import { SQUIGGLE_PLAYGROUND } from "@/lib/constants";
import { createRelativeValuesCacheFromDTO } from "@/relative-values/cache";
import { RelativeValuesDefinitionFullDTO } from "@/relative-values/data/full";
import { RelativeValuesExportFullDTO } from "@/relative-values/data/fullExport";
import { relativeValuesHubLinker } from "@/relative-values/linker";

function hubPlaygroundUrl(code: string) {
  return getPlaygroundUrl({ code, baseUrl: SQUIGGLE_PLAYGROUND }).toString();
}

export const RelativeValuesModelLayout: FC<
  PropsWithChildren<{
    owner: string;
    slug: string;
    code: string;
    variableName: string;
    cache: RelativeValuesExportFullDTO["cache"];
    definitionRevision: RelativeValuesDefinitionFullDTO["currentRevision"];
  }>
> = ({
  owner,
  slug,
  code,
  variableName,
  cache,
  definitionRevision,
  children,
}) => {
  const [evaluatorResult, setEvaluatorResult] = useState<
    result<ModelEvaluator, string> | undefined
  >();

  const evaluatorCache = useMemo(
    () => createRelativeValuesCacheFromDTO(cache),
    [cache]
  );

  useEffect(() => {
    let cancelled = false;
    // ModelEvaluator.create is async because Squiggle evaluation is async
    ModelEvaluator.create(code, variableName, {
      cache: evaluatorCache,
      linker: relativeValuesHubLinker,
    }).then((result) => {
      if (!cancelled) {
        setEvaluatorResult(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, variableName, evaluatorCache]);

  return evaluatorResult ? (
    evaluatorResult.ok ? (
      <RelativeValuesProvider
        definition={definitionRevision}
        evaluator={evaluatorResult.value}
        getPlaygroundUrl={hubPlaygroundUrl}
        linker={relativeValuesHubLinker}
        sourceId={serializeSourceId({ owner, slug })}
      >
        {children}
      </RelativeValuesProvider>
    ) : (
      <div>Error: {evaluatorResult.value}</div>
    )
  ) : (
    <Skeleton height={256} />
  );
};
