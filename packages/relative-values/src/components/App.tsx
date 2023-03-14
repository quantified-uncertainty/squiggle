import { getQuriCatalogAndModel } from "@/builtins/quri";
import { getQuriSoftwareCatalogAndModel } from "@/builtins/quri-software";
import { SafeHydrate } from "@/components/SafeHydrate";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FC } from "react";
import { DashboardProvider } from "./Dashboard/DashboardProvider";
import { A } from "./ui/A";

const Dashboard =
  typeof window === "undefined"
    ? null
    : dynamic(() =>
        import("@/components/Dashboard").then((mod) => mod.Dashboard)
      );

export const App: FC = () => {
  return (
    <main className="p-4">
      <SafeHydrate>
        {() =>
          Dashboard ? (
            <DashboardProvider generateInitialValue={getQuriCatalogAndModel}>
              <Dashboard />
            </DashboardProvider>
          ) : null
        }
      </SafeHydrate>
    </main>
  );
};
