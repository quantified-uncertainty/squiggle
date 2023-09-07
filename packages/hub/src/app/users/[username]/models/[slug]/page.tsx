import QueryNode, {
  EditModelPageQuery,
} from "@/__generated__/EditModelPageQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { EditModelPage } from "./EditModelPage";

type Props = {
  params: { username: string; slug: string };
};

export default async function Page({ params }: Props) {
  const query = await loadPageQuery<EditModelPageQuery>(QueryNode, {
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
