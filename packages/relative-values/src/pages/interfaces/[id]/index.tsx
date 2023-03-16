import { allInterfaces } from "@/builtins";
import { SafeHydrate } from "@/components/SafeHydrate";

import { Interface } from "@/components/Interface";
import { InterfaceProvider } from "@/components/Interface/InterfaceProvider";
import { Layout } from "@/components/Layout";
import { useRouter } from "next/router";

export default function InterfaceByIdPage() {
  const {
    query: { id },
  } = useRouter();

  return (
    <Layout>
      <SafeHydrate>
        {() => {
          const interfaceWithModels = allInterfaces.find(
            (i) => i.catalog.id === id
          );
          if (!interfaceWithModels) {
            return <div className="text-red-500">Not found</div>;
          }

          return (
            <InterfaceProvider
              initialValue={{
                ...interfaceWithModels,
                currentModel: { mode: "unselected" },
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
