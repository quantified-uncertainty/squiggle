"use client";

import { GridView } from "@/components/View/GridView";
import { useViewContext } from "@/components/View/ViewProvider";

export default function GridViewPage() {
  const { evaluator } = useViewContext();

  return evaluator.ok ? <GridView model={evaluator.value} /> : null;
}
