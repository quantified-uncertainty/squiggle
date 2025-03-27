import { PropsWithChildren } from "react";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { H1 } from "@/components/ui/Headers";
import { Help } from "@/components/ui/Help";
import { checkRootUser } from "@/users/auth";

import { EvalsTabs } from "./EvalsTabs";

export default async function EvalsLayout({ children }: PropsWithChildren) {
  await checkRootUser();

  return (
    <FullLayoutWithPadding>
      <H1 size="large">
        Evals{" "}
        <Help text="Experimental feature - AI evaluations for question sets" />
      </H1>
      <EvalsTabs />
      <div className="mt-6">{children}</div>
    </FullLayoutWithPadding>
  );
}
