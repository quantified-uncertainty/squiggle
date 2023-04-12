"use client";

import { FC, PropsWithChildren, useMemo } from "react";
import { ModelProvider, useSelectedModel } from "../../ModelProvider";
import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { ValueAndUncertaintyPlot } from "@/components/View/PlotView/ValueAndUncertaintyPlot";
import { useViewContext } from "@/components/View/ViewProvider";
import { useRouter } from "next/navigation";
import { itemRoute } from "@/routes";
import { Item } from "@/types";


export default function ItemLayout({
  params,
  children,
}: PropsWithChildren<{
  params: { itemId: string; modelId: string };
}>) {
  const model = useSelectedModel();
  const { catalog } = useSelectedInterface();
  const { evaluator } = useViewContext();
  let item = catalog.items.find((item) => item.id === params.itemId);
  const router = useRouter()
  const sendToItem = (item:Item) => {
    router.push(itemRoute(catalog.id, params.modelId, item.id))
  }

  if (!item) {
    return <div>Item not found</div>;
  } else {
    return (
      <div>
        {item.name} {item.id} {item.description}
        {evaluator.ok && (
          <ValueAndUncertaintyPlot
            model={evaluator.value}
            selectedId={item.id}
            onClick={(item) => sendToItem(item)}
          />
        )}
      </div>
    );
  }
}
