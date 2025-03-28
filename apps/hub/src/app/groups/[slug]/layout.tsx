import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

import { WithNavMenuLayout } from "@/components/layout/WithNavMenuLayout";
import { loadGroupCard } from "@/groups/data/groupCards";

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

  return (
    <WithNavMenuLayout menu={<GroupNav group={group} />}>
      {children}
    </WithNavMenuLayout>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}
