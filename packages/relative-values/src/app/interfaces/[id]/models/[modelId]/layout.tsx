"use client";

import { FC, PropsWithChildren, useMemo } from "react";
import { ModelProvider, useSelectedModel } from "./ModelProvider";

import { useInterfaceContext } from "@/components/Interface/InterfaceProvider";
import { ModelPicker } from "@/components/Interface/ModelPicker";
import { ViewProvider } from "@/components/View/ViewProvider";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { ChipIcon } from "@/components/ui/icons/ChipIcon";
import { modelRoute } from "@/routes";
import { useInterfaceById } from "@/storage/StorageProvider";
import { ModelEvaluator } from "@/values/ModelEvaluator";
import { createModelEvaluatorWithCache } from "@/values/loadCache";

const NotFound: FC<{ error: string }> = ({ error }) => (
  <div className="text-red-500 p-4">{error}</div>
);

const InnerModelLayout: FC<PropsWithChildren> = ({ children }) => {
  const model = useSelectedModel();
  const { interfaceId } = useInterfaceContext();
  const interfaceWithModels = useInterfaceById(interfaceId);

  const evaluator = useMemo<
    ReturnType<(typeof ModelEvaluator)["create"]> | undefined
  >(() => (model ? createModelEvaluatorWithCache(model) : undefined), [model]);

  if (!interfaceWithModels || !model || !evaluator) {
    return <NotFound error="Model not found" />;
  }

  return (
    <ViewProvider
      initialClusters={interfaceWithModels.catalog.clusters}
      evaluator={evaluator}
    >
      <div className="mb-8 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex">
          <div>
            {model ? (
              <div className="px-3 py-1 bg-emerald-50 text-emerald-900 rounded-sm hover:bg-emerald-300 text-lg font-semibold flex">
                <span className="pt-1 pr-2">
                  <ChipIcon className="fill-emerald-600" />
                </span>
                <span>{model.title}</span>
              </div>
            ) : (
              ""
            )}
          </div>
          <div>
            <ModelPicker />
            {evaluator.ok ? null : (
              <pre className="text-red-700">{evaluator.value}</pre>
            )}
          </div>
        </div>
        <StyledTabLink.List>
          <StyledTabLink
            name="List"
            href={modelRoute(interfaceId, model.id, "list")}
          />
          <StyledTabLink
            name="Grid"
            href={modelRoute(interfaceId, model.id, "grid")}
          />
          <StyledTabLink
            name="Plot"
            href={modelRoute(interfaceId, model.id, "plot")}
          />
          <StyledTabLink
            name="Editor"
            href={modelRoute(interfaceId, model.id, "edit")}
          />
        </StyledTabLink.List>
      </div>
      <div>{children}</div>
    </ViewProvider>
  );
};

export default function ModelLayout({
  params,
  children,
}: PropsWithChildren<{
  params: { modelId: string };
}>) {
  return (
    <ModelProvider value={{ selectedId: params.modelId }}>
      <InnerModelLayout>{children}</InnerModelLayout>
    </ModelProvider>
  );
}
