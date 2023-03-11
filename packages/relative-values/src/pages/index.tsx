import { SafeHydrate } from "@/components/SafeHydrate";
import dynamic from "next/dynamic";

const Dashboard =
  typeof window === "undefined"
    ? null
    : dynamic(() =>
        import("@/components/Dashboard").then((mod) => mod.Dashboard)
      );

export default function IndexPage() {
  return (
    <main className="p-4">
      <SafeHydrate>{() => (Dashboard ? <Dashboard /> : null)}</SafeHydrate>
    </main>
  );
}
