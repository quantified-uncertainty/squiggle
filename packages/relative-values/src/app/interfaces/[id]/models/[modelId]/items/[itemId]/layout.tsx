"use client";

import { FC, PropsWithChildren, useMemo, useState } from "react";
import { ModelProvider, useSelectedModel } from "../../ModelProvider";
import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import { ValueAndUncertaintyPlot } from "@/components/View/PlotView/ValueAndUncertaintyPlot";
import { useViewContext } from "@/components/View/ViewProvider";
import { useRouter } from "next/navigation";
import { itemRoute } from "@/routes";
import { Item } from "@/types";
import { SquiggleChart } from "@quri/squiggle-components";
import { getModelCode, Model } from "@/model/utils";
import Link from "next/link";

export default function ItemLayout({
  params,
  children,
}: PropsWithChildren<{
  params: { itemId: string; modelId: string };
}>) {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const model = useSelectedModel();
  const { catalog } = useSelectedInterface();
  const { evaluator } = useViewContext();
  let item = catalog.items.find((item) => item.id === params.itemId);
  const router = useRouter();

  const sendToItem = (item: Item) => {
    router.push(itemRoute(catalog.id, params.modelId, item.id));
  };

  const selectedDiv = () => {
    const selectedItem = catalog.items.find((item) => item.id === selected);
    return (
      selectedItem &&
      model && (
        <div>
          <h3 className="font-semibold text-slate-800 text-md">
            {selectedItem.name}
          </h3>
          <p>{selectedItem.description}</p>
          <p>{selectedItem.id}</p>
          <p>{selectedItem.clusterId}</p>
          <Link href={itemRoute(catalog.id, model.id, selectedItem.id)}>
            Link
          </Link>
        </div>
      )
    );
  };

  if (!item) {
    return <div>Item not found</div>;
  } else {
    const code =
      model &&
      `${getModelCode(model)} \n a = fn("${item.id}", "${
        selected ? selected : catalog.items[4].id
      }") \n a[0]/a[1]`;

    return (
      <div className="max-w-6xl mx-auto">
        <h2 className="font-semibold text-slate-800 text-lg">{item.name}</h2>
        {item.id}
        <p>{item.description}</p>
        {code && (
          <SquiggleChart
            code={code}
            distributionChartSettings={{ showSummary: true }}
          />
        )}
        {evaluator.ok && (
          <div>
            <ValueAndUncertaintyPlot
              model={evaluator.value}
              selectedId={item.id}
              onClick={(item) => {
                setSelected(item.id);
              }}
              height={200}
            />
            {selectedDiv()}
            <div></div>
          </div>
        )}
      </div>
    );
  }
}
