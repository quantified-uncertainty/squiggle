import { PropsWithChildren } from "react";

import { LockIcon } from "@quri/ui";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { H1 } from "@/components/ui/Headers";
import { checkRootUser } from "@/users/auth";

export default async function AdminLayout({ children }: PropsWithChildren) {
  await checkRootUser();

  return (
    <div>
      <div className="bg-red-200 p-4">
        <H1>
          <div className="flex items-center gap-1">
            <LockIcon />
            <span>Admin console</span>
          </div>
        </H1>
      </div>
      <FullLayoutWithPadding>{children}</FullLayoutWithPadding>
    </div>
  );
}
