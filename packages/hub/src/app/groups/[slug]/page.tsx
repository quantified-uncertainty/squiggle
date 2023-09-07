import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { GroupPage } from "./GroupPage";
import QueryNode, {
  GroupPageQuery,
} from "@/__generated__/GroupPageQuery.graphql";

type Props = {
  params: { slug: string };
};

export default async function OuterGroupPage({ params }: Props) {
  const query = await loadPageQuery<GroupPageQuery>(QueryNode, {
    slug: params.slug,
  });

  return (
    <NarrowPageLayout>
      <GroupPage query={query} />
    </NarrowPageLayout>
  );
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.slug };
}
