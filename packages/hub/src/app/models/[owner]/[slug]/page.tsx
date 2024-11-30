import { loadPageQuery } from "@/relay/loadPageQuery";

import { EditModelPage } from "./EditModelPage";

import QueryNode, {
  EditModelPageQuery,
} from "@/__generated__/EditModelPageQuery.graphql";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

export default async function Page({ params }: Props) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<EditModelPageQuery>(QueryNode, {
    input: { owner, slug },
  });

  return (
    <div className="bg-white">
      <EditModelPage query={query} />
    </div>
  );
}
