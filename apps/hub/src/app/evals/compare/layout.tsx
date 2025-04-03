import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { H1 } from "@/components/ui/Headers";

export default function CompareEvaluationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FullLayoutWithPadding>
      <div className="mb-6">
        <H1>Compare Evaluations</H1>
      </div>
      {children}
    </FullLayoutWithPadding>
  );
}
