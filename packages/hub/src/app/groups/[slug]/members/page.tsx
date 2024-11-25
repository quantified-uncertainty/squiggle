import { loadPageQuery } from "@/relay/loadPageQuery";

import { GroupMembersPage } from "./GroupMembersPage";

import QueryNode, {
  GroupMembersPageQuery,
} from "@/__generated__/GroupMembersPageQuery.graphql";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function OuterGroupMembersPage({ params }: Props) {
  const { slug } = await params;
  const query = await loadPageQuery<GroupMembersPageQuery>(QueryNode, {
    slug,
  });

  return <GroupMembersPage query={query} />;
}
