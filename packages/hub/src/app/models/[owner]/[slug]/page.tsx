import { loadPageQuery } from "@/relay/loadPageQuery";

import { EditModelPage } from "./EditModelPage";

import QueryNode, {
  EditModelPageQuery,
} from "@/__generated__/EditModelPageQuery.graphql";

type Props = {
  params: { owner: string; slug: string };
};

export default async function Page({ params }: Props) {
  const query = await loadPageQuery<EditModelPageQuery>(QueryNode, {
    input: {
      owner: params.owner,
      slug: params.slug,
    },
  });

  return (
    <div className="bg-white">
      <EditModelPage query={query} />
    </div>
  );
}
