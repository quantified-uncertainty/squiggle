import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { WithNavMenuLayout } from "@/components/layout/WithNavMenuLayout";
import { auth } from "@/lib/server/auth";
import { loadLayoutUser } from "@/users/data/layoutUser";

import { UserNav } from "./UserNav";

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
    <WithNavMenuLayout menu={<UserNav user={user} isMe={isMe} />}>
      <NarrowPageLayout>{children}</NarrowPageLayout>
    </WithNavMenuLayout>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
