import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";

import { GroupLayout } from "./GroupLayout";

import QueryNode, {
  GroupLayoutQuery,
} from "@/__generated__/GroupLayoutQuery.graphql";

type Props = PropsWithChildren<{
  params: Promise<{ slug: string }>;
}>;

export default async function OuterGroupLayout({ params, children }: Props) {
  const { slug } = await params;
  const query = await loadPageQuery<GroupLayoutQuery>(QueryNode, {
    slug,
  });

  return (
    <NarrowPageLayout>
      <GroupLayout query={query}>{children}</GroupLayout>
    </NarrowPageLayout>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}
