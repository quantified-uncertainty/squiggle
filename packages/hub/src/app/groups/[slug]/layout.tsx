import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { GroupLayout } from "./GroupLayout";
import QueryNode, {
  GroupLayoutQuery,
} from "@/__generated__/GroupLayoutQuery.graphql";

type Props = PropsWithChildren<{
  params: { slug: string };
}>;

export default async function OuterGroupLayout({ params, children }: Props) {
  const query = await loadPageQuery<GroupLayoutQuery>(QueryNode, {
    slug: params.slug,
  });

  return (
    <NarrowPageLayout>
      <GroupLayout query={query}>{children}</GroupLayout>
    </NarrowPageLayout>
  );
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.slug };
}
