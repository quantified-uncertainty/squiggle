"use client";

import { FC, PropsWithChildren, useMemo } from "react";
import { ModelProvider, useSelectedModel } from "../../ModelProvider";
import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { ValueAndUncertaintyPlot } from "@/components/View/PlotView/ValueAndUncertaintyPlot";
import { useViewContext } from "@/components/View/ViewProvider";

export default function ItemLayout({
  params,
  children,
}: PropsWithChildren<{
  params: { itemId: string; modelId: string };
}>) {
  const model = useSelectedModel();
  const { catalog } = useSelectedInterface();
  const { evaluator } = useViewContext();
  console.log("H", catalog);
  let item = catalog.items.find((item) => item.id === params.itemId);

  if (!item) {
    return <div>Item not found</div>;
  } else {
    return (
      <div>
        {item.name} {item.id} {item.description}
        {evaluator.ok && <ValueAndUncertaintyPlot model={evaluator.value} selectedId={item.id} />}
      </div>
    );
  }
}
