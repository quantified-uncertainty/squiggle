import { PropsWithChildren } from "react";

import { LinkButton } from "@/components/ui/LinkButton";
import { newGroupRoute } from "@/lib/routes";
import { auth } from "@/lib/server/auth";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";

export default async function GroupsLayout({ children }: PropsWithChildren) {
  const session = await auth();

  return (
    <MainAreaLayout
      title="Groups"
      actions={
        session && (
          <LinkButton href={newGroupRoute()} theme="primary">
            New Group
          </LinkButton>
        )
      }
    >
      {children}
    </MainAreaLayout>
  );
}
