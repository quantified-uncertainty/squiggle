import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

import { UserIcon } from "@quri/ui";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H1 } from "@/components/ui/Headers";
import {
  StyledTabLink,
  StyledTabLinkList,
} from "@/components/ui/StyledTabLink";
import {
  userDefinitionsRoute,
  userGroupsRoute,
  userRoute,
  userVariablesRoute,
} from "@/lib/routes";
import { auth } from "@/lib/server/auth";
import { loadLayoutUser } from "@/users/data/layoutUser";

import { NewModelButton } from "./NewModelButton";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function OuterUserLayout({
  params,
  children,
}: PropsWithChildren<Props>) {
  const { username } = await params;
  const user = await loadLayoutUser(username);
  if (!user) {
    notFound();
  }
  const session = await auth();
  const isMe = user.id === session?.user.id;

  return (
    <NarrowPageLayout>
      <div className="space-y-8">
        <H1 size="large">
          <div className="flex items-center">
            <UserIcon className="mr-2 opacity-50" />
            {user.username}
          </div>
        </H1>
        <div className="flex items-center gap-4">
          <StyledTabLinkList>
            {isMe || user.hasModels ? (
              <StyledTabLink
                name="Models"
                href={userRoute({ username: user.username })}
              />
            ) : null}
            {isMe || user.hasVariables ? (
              <StyledTabLink
                name="Variables"
                href={userVariablesRoute({ username: user.username })}
              />
            ) : null}
            {isMe || user.hasDefinitions ? (
              <StyledTabLink
                name="Definitions"
                href={userDefinitionsRoute({ username: user.username })}
              />
            ) : null}
            {isMe || user.hasGroups ? (
              <StyledTabLink
                name="Groups"
                href={userGroupsRoute({ username: user.username })}
              />
            ) : null}
          </StyledTabLinkList>
          {isMe && <NewModelButton />}
        </div>
        <div>{children}</div>
      </div>
    </NarrowPageLayout>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
