import { Metadata, ResolvingMetadata } from "next";
import { UserView } from "./UserView";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import UserViewQueryNode, {
  UserViewQuery,
} from "@/__generated__/UserViewQuery.graphql";

type Props = {
  params: { username: string };
};

export default async function UserPage({ params }: Props) {
  const query = await loadSerializableQuery<
    typeof UserViewQueryNode,
    UserViewQuery
  >(UserViewQueryNode.params, { username: params.username });

  return (
    <NarrowPageLayout>
      <UserView query={query} />
    </NarrowPageLayout>
  );
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return { title: `${params.username} | ${(await parent).title?.absolute}` };
}
