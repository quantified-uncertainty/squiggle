import { Metadata } from "next";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { UserPage } from "./UserPage";

import QueryNode, {
  UserPageQuery,
} from "@/__generated__/UserPageQuery.graphql";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function OuterUserPage({ params }: Props) {
  const { username } = await params;
  const query = await loadPageQuery<UserPageQuery>(QueryNode, {
    username,
  });

  return <UserPage query={query} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
