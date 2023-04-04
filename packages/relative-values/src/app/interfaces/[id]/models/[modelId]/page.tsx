"use client";

import { ListView } from "@/components/View/ListView";
import { useViewContext } from "@/components/View/ViewProvider";

export default function ModelPage() {
  const { evaluator } = useViewContext();

  return evaluator.ok ? <ListView model={evaluator.value} /> : null;
}
