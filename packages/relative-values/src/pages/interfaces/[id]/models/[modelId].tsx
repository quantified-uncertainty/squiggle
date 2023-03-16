import { allInterfaces } from "@/builtins";
import { SafeHydrate } from "@/components/SafeHydrate";

import { Interface } from "@/components/Interface";
import { InterfaceProvider } from "@/components/Interface/InterfaceProvider";
import { Layout } from "@/components/Layout";
import { useRouter } from "next/router";
import { FC } from "react";

const NotFound: FC<{ error: string }> = ({ error }) => (
  <div className="text-red-500 p-4">{error}</div>
);

export default function InterfaceByIdPage() {
  const {
    query: { id, modelId },
  } = useRouter();

  return (
    <Layout>
      <SafeHydrate>
        {() => {
          const interfaceWithModels = allInterfaces.find(
            (i) => i.catalog.id === id
          );
          if (!interfaceWithModels) {
            return <NotFound error="Interface not found" />;
          }

          if (!interfaceWithModels.models.has(modelId as string)) {
            return <NotFound error="Model not found" />;
          }

          return (
            <InterfaceProvider
              initialValue={{
                ...interfaceWithModels,
                currentModel: {
                  mode: "selected",
                  id: modelId as string,
                },
              }}
            >
              <Interface />
            </InterfaceProvider>
          );
        }}
      </SafeHydrate>
    </Layout>
  );
}
