import { Metadata } from "next";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { UserVariablesPage } from "./UserVariablesPage";

import QueryNode, {
  UserVariablesPageQuery,
} from "@/__generated__/UserVariablesPageQuery.graphql";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function OuterUserVariablesPage({ params }: Props) {
  const { username } = await params;
  const query = await loadPageQuery<UserVariablesPageQuery>(QueryNode, {
    username,
  });

  return <UserVariablesPage query={query} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
