"use client";
import { SafeHydrate } from "@/components/SafeHydrate";

import { ModelProvider } from "./ModelProvider";
import { SSRSafeModelSection } from "./SSRSafeModelSection";

export default function ModelPage({
  params,
}: {
  params: { id: string; modelId: string };
}) {
  return (
    <SafeHydrate>
      {() => {
        return (
          <ModelProvider value={{ selectedId: params.modelId }}>
            <SSRSafeModelSection />
          </ModelProvider>
        );
      }}
    </SafeHydrate>
  );
}
