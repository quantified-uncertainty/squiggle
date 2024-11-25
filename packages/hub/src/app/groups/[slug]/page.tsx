import { loadPageQuery } from "@/relay/loadPageQuery";

import { GroupPage } from "./GroupPage";

import QueryNode, {
  GroupPageQuery,
} from "@/__generated__/GroupPageQuery.graphql";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OuterGroupPage({ params }: Props) {
  const { slug } = await params;
  const query = await loadPageQuery<GroupPageQuery>(QueryNode, {
    slug,
  });

  return <GroupPage query={query} />;
}
