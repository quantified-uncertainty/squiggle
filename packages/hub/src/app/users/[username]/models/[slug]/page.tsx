import QueryNode, {
  EditModelPageQuery,
} from "@/__generated__/EditModelPageQuery.graphql";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import { EditModelPage } from "./EditModelPage";

type Props = {
  params: { username: string; slug: string };
};

export default async function Page({ params }: Props) {
  const query = await loadSerializableQuery<
    typeof QueryNode,
    EditModelPageQuery
  >(QueryNode.params, {
    input: {
      owner: { username: params.username },
      slug: params.slug,
    },
  });

  return (
    <div className="bg-white">
      <EditModelPage query={query} />
    </div>
  );
}
