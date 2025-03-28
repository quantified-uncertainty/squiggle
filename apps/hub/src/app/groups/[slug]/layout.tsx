import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { WithNavMenuLayout } from "@/components/layout/WithNavMenuLayout";
import { loadGroupCard } from "@/groups/data/groupCards";
import { hasGroupMembership } from "@/groups/data/helpers";

import { GroupNav } from "./GroupNav";

type Props = PropsWithChildren<{
  params: Promise<{ slug: string }>;
}>;

export default async function GroupLayout({ params, children }: Props) {
  const { slug } = await params;
  const group = await loadGroupCard(slug);
  if (!group) {
    notFound();
  }

  const isMember = await hasGroupMembership(slug);

  return (
    <WithNavMenuLayout menu={<GroupNav group={group} />}>
      <NarrowPageLayout>{children}</NarrowPageLayout>
    </WithNavMenuLayout>
    // {isMember && <NewModelButton group={group.slug} />}
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}
