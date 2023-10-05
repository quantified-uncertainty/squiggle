import { Metadata } from "next";

import QueryNode, {
  UserDefinitionsPageQuery,
} from "@/__generated__/UserDefinitionsPageQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { UserDefinitionsPage } from "./UserDefinitionsPage";

type Props = {
  params: { username: string };
};

export default async function OuterUserDefinitionsPage({ params }: Props) {
  const query = await loadPageQuery<UserDefinitionsPageQuery>(QueryNode, {
    username: params.username,
  });

  return <UserDefinitionsPage query={query} />;
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.username };
}
