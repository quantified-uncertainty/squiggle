import { Metadata } from "next";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { UserDefinitionsPage } from "./UserDefinitionsPage";

import QueryNode, {
  UserDefinitionsPageQuery,
} from "@/__generated__/UserDefinitionsPageQuery.graphql";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function OuterUserDefinitionsPage({ params }: Props) {
  const { username } = await params;
  const query = await loadPageQuery<UserDefinitionsPageQuery>(QueryNode, {
    username,
  });

  return <UserDefinitionsPage query={query} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
