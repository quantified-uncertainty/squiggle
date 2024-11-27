import { loadPageQuery } from "@/relay/loadPageQuery";

import { GroupsPage } from "./GroupsPage";

import QueryNode, {
  GroupsPageQuery,
} from "@/__generated__/GroupsPageQuery.graphql";

export default async function OuterGroupsPage() {
  const query = await loadPageQuery<GroupsPageQuery>(QueryNode, {});

  return <GroupsPage query={query} />;
}
