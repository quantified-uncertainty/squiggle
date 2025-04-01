import { PropsWithChildren } from "react";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { H1 } from "@/components/ui/Headers";
import { checkRootUser } from "@/users/auth";

import { EvaluationsHelp } from "./EvaluationsHelp";

export default async function EvalsLayout({ children }: PropsWithChildren) {
  await checkRootUser();

  return (
    <FullLayoutWithPadding>
      <H1 size="large">
        Evals <EvaluationsHelp />
      </H1>
      <div className="mt-6">{children}</div>
    </FullLayoutWithPadding>
  );
}
