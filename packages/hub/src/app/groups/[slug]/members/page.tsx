import QueryNode, {
  GroupMembersPageQuery,
} from "@/__generated__/GroupMembersPageQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { GroupMembersPage } from "./GroupMembersPage";

type Props = {
  params: { slug: string };
};

export default async function OuterGroupMembersPage({ params }: Props) {
  const query = await loadPageQuery<GroupMembersPageQuery>(QueryNode, {
    slug: params.slug,
  });

  return <GroupMembersPage query={query} />;
}
