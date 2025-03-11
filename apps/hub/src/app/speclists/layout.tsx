import { PropsWithChildren } from "react";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { H1 } from "@/components/ui/Headers";
import { checkRootUser } from "@/users/auth";

export default async function SpecListsLayout({ children }: PropsWithChildren) {
  await checkRootUser();

  return (
    <FullLayoutWithPadding>
      <div className="mb-6">
        <H1 size="large">Specs & Evals</H1>
        <p className="text-sm text-gray-500">
          Experimental feature - AI evaluations for spec lists
        </p>
      </div>
      {children}
    </FullLayoutWithPadding>
  );
}
