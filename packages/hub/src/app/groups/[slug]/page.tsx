import QueryNode, {
  GroupPageQuery,
} from "@/__generated__/GroupPageQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { GroupPage } from "./GroupPage";

type Props = {
  params: { slug: string };
};

export default async function OuterGroupPage({ params }: Props) {
  const query = await loadPageQuery<GroupPageQuery>(QueryNode, {
    slug: params.slug,
  });

  return <GroupPage query={query} />;
}
