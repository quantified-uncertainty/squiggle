import { Metadata } from "next";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { UserVariablesPage } from "./UserVariablesPage";

import QueryNode, {
  UserVariablesPageQuery,
} from "@/__generated__/UserVariablesPageQuery.graphql";

type Props = {
  params: { username: string };
};

export default async function OuterUserVariablesPage({ params }: Props) {
  const query = await loadPageQuery<UserVariablesPageQuery>(QueryNode, {
    username: params.username,
  });

  return <UserVariablesPage query={query} />;
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.username };
}
