"use client";

import { ListView } from "@/components/View/ListView";
import { useViewContext } from "@/components/View/ViewProvider";
import { useSelectedModel } from "./ModelProvider";

export default function ModelPage() {
  const { evaluator } = useViewContext();
  const model = useSelectedModel();

  return evaluator.ok ? <ListView modelEvaluator={evaluator.value} modelId={model && model.id || ""}/> : null;
}
