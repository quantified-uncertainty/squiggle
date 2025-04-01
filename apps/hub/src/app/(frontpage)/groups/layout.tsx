import { PropsWithChildren } from "react";

import { LinkButton } from "@/components/ui/LinkButton";
import { ModalHelp } from "@/components/ui/ModalHelp";
import { newGroupRoute } from "@/lib/routes";
import { auth } from "@/lib/server/auth";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";

export default async function GroupsLayout({ children }: PropsWithChildren) {
  const session = await auth();

  return (
    <MainAreaLayout
      title="Groups"
      help={
        <ModalHelp
          title="About Groups"
          body={
            <div className="space-y-2">
              <p>Groups are a way to organize models and other entities.</p>
              <p>
                An entity owned by a group is editable by everyone in the group.
              </p>
            </div>
          }
        />
      }
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
