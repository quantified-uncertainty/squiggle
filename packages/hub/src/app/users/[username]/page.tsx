import { Metadata } from "next";

import QueryNode, {
  UserViewQuery,
} from "@/__generated__/UserViewQuery.graphql";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import { UserView } from "./UserView";

type Props = {
  params: { username: string };
};

export default async function UserPage({ params }: Props) {
  const query = await loadSerializableQuery<typeof QueryNode, UserViewQuery>(
    QueryNode.params,
    { username: params.username }
  );

  return (
    <NarrowPageLayout>
      <UserView query={query} />
    </NarrowPageLayout>
  );
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.username };
}
