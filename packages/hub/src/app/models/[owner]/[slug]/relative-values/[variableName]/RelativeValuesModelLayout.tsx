"use client";

import { FC, PropsWithChildren, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { result } from "@quri/squiggle-lang";

import { RelativeValuesProvider } from "@/relative-values/components/views/RelativeValuesProvider";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { RelativeValuesDefinitionFullDTO } from "@/server/relative-values/data/full";
import { RelativeValuesExportFullDTO } from "@/server/relative-values/data/fullExport";

export const RelativeValuesModelLayout: FC<
  PropsWithChildren<{
    code: string;
    variableName: string;
    cache: RelativeValuesExportFullDTO["cache"];
    definitionRevision: RelativeValuesDefinitionFullDTO["currentRevision"];
  }>
> = ({ code, variableName, cache, definitionRevision, children }) => {
  const [evaluatorResult, setEvaluatorResult] = useState<
    result<ModelEvaluator, string> | undefined
  >();

  useEffect(() => {
    // ModelEvaluator.create is async because SqProject.run is async
    ModelEvaluator.create(code, variableName, cache).then(setEvaluatorResult);
  }, [code, variableName, cache]);

  return evaluatorResult ? (
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
};
