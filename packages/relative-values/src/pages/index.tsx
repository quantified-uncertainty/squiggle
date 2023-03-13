import { SafeHydrate } from "@/components/SafeHydrate";
import { A } from "@/components/ui/A";
import dynamic from "next/dynamic";
import Link from "next/link";

const Dashboard =
  typeof window === "undefined"
    ? null
    : dynamic(() =>
        import("@/components/Dashboard").then((mod) => mod.Dashboard)
      );

export default function IndexPage() {
  return (
    <main className="p-4 flex flex-col">
      <Link href="/builtins/quri">
        <A>QURI</A>
      </Link>
      <Link href="/builtins/quri-software">
        <A className="text-blue-500 hover:underline">QURI software</A>
      </Link>
    </main>
  );
}
