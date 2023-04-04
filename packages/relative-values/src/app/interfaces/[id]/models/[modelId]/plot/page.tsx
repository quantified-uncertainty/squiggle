"use client";

import { PlotView } from "@/components/View/PlotView";
import { useViewContext } from "@/components/View/ViewProvider";

export default function PlotViewPage() {
  const { evaluator } = useViewContext();

  return evaluator.ok ? <PlotView model={evaluator.value} /> : null;
}
