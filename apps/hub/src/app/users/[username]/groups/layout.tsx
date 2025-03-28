import { PropsWithChildren } from "react";

import { MainAreaLayout } from "@/components/layout/MainAreaLayout";
import { LinkButton } from "@/components/ui/LinkButton";
import { newGroupRoute } from "@/lib/routes";
import { auth } from "@/lib/server/auth";

export default async function GroupsLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ username: string }> }>) {
  const { username } = await params;
  const session = await auth();
  const isMe = username === session?.user.username;

  return (
    <MainAreaLayout
      title={`Groups by ${username}`}
      actions={
        isMe && (
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
