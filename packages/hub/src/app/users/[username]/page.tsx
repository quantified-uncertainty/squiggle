import { Metadata } from "next";

import QueryNode, {
  UserPageQuery,
} from "@/__generated__/UserPageQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { UserPage } from "./UserPage";

type Props = {
  params: { username: string };
};

export default async function OuterUserPage({ params }: Props) {
  const query = await loadPageQuery<UserPageQuery>(QueryNode, {
    username: params.username,
  });

  return <UserPage query={query} />;
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.username };
}
