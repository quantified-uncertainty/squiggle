import { PropsWithChildren } from "react";

import { LinkButton } from "@/components/ui/LinkButton";
import { newGroupRoute } from "@/lib/routes";
import { auth } from "@/lib/server/auth";

import { FrontpageMainAreaLayout } from "../FrontpageMainAreaLayout";

export default async function GroupsLayout({ children }: PropsWithChildren) {
  const session = await auth();
  return (
    <FrontpageMainAreaLayout
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
    </FrontpageMainAreaLayout>
  );
}
