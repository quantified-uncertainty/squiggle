import { Metadata } from "next";

import QueryNode, {
  UserGroupsPageQuery,
} from "@/__generated__/UserGroupsPageQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { UserGroupsPage } from "./UserGroupsPage";

type Props = {
  params: { username: string };
};

export default async function OuterUserGroupsPage({ params }: Props) {
  const query = await loadPageQuery<UserGroupsPageQuery>(QueryNode, {
    username: params.username,
  });

  return <UserGroupsPage query={query} />;
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.username };
}
