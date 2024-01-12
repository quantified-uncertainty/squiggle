import { getServerSession } from "next-auth";
import { PropsWithChildren } from "react";

import { LockIcon } from "@quri/ui";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H1 } from "@/components/ui/Headers";

import { authOptions } from "../api/auth/[...nextauth]/authOptions";

export default async function AdminLayout({ children }: PropsWithChildren) {
  const session = await getServerSession(authOptions);

  const email = session?.user.email;

  const { ROOT_EMAILS } = process.env;
  if (!email || !ROOT_EMAILS?.includes(email)) {
    return <NarrowPageLayout>Access denied.</NarrowPageLayout>;
  }

  return (
    <div>
      <div className="bg-red-200 p-4">
        <H1>
          <div className="flex gap-1 items-center">
            <LockIcon />
            <span>Admin console</span>
          </div>
        </H1>
      </div>
      <FullLayoutWithPadding>{children}</FullLayoutWithPadding>
    </div>
  );
}
