import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import { GroupView } from "./GroupView";
import QueryNode, {
  GroupViewQuery,
} from "@/__generated__/GroupViewQuery.graphql";

type Props = {
  params: { slug: string };
};

export default async function GroupPage({ params }: Props) {
  const query = await loadSerializableQuery<typeof QueryNode, GroupViewQuery>(
    QueryNode.params,
    { slug: params.slug }
  );

  return (
    <NarrowPageLayout>
      <GroupView query={query} />
    </NarrowPageLayout>
  );
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.slug };
}
