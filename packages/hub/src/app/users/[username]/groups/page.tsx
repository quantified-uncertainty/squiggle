import { Metadata } from "next";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { UserGroupsPage } from "./UserGroupsPage";

import QueryNode, {
  UserGroupsPageQuery,
} from "@/__generated__/UserGroupsPageQuery.graphql";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function OuterUserGroupsPage({ params }: Props) {
  const { username } = await params;
  const query = await loadPageQuery<UserGroupsPageQuery>(QueryNode, {
    username,
  });

  return <UserGroupsPage query={query} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
