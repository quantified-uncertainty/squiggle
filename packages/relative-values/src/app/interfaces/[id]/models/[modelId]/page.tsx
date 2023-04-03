"use client";

import { ModelSection } from "@/components/Interface/ModelSection";
import { ModelProvider } from "./ModelProvider";

export default function ModelPage({
  params,
}: {
  params: { id: string; modelId: string };
}) {
  return (
    <ModelProvider value={{ selectedId: params.modelId }}>
      <ModelSection />
    </ModelProvider>
  );
}
