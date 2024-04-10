import { Metadata } from "next";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { UserModelExportsPage } from "./UserModelExportsPage";

import QueryNode, {
  UserModelExportsPageQuery,
} from "@/__generated__/UserModelExportsPageQuery.graphql";

type Props = {
  params: { username: string };
};

export default async function OuterUserModelExportsPage({ params }: Props) {
  const query = await loadPageQuery<UserModelExportsPageQuery>(QueryNode, {
    username: params.username,
  });

  return <UserModelExportsPage query={query} />;
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.username };
}
