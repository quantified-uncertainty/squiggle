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

const builtins = {
  quri: getQuriCatalogAndModel,
  "quri-software": getQuriSoftwareCatalogAndModel,
};

export const App: FC<{ mode: keyof typeof builtins }> = ({ mode }) => {
  return (
    <main className="p-4">
      <div className="mb-4">
        <Link href="/">
          <A>&larr; Index</A>
        </Link>
      </div>
      <SafeHydrate>
        {() =>
          Dashboard ? (
            <DashboardProvider key={mode} getInitialValue={builtins[mode]}>
              <Dashboard />
            </DashboardProvider>
          ) : null
        }
      </SafeHydrate>
    </main>
  );
};
