import { loadPageQuery } from "@/relay/loadPageQuery";

import { ViewModelPage } from "./ViewModelPage";

import QueryNode, {
  ViewModelPageQuery,
} from "@/__generated__/ViewModelPageQuery.graphql";

type Props = {
  params: { owner: string; slug: string };
};

export default async function OuterModelPage({ params }: Props) {
  const query = await loadPageQuery<ViewModelPageQuery>(QueryNode, {
    input: { owner: params.owner, slug: params.slug },
  });

  return (
    <div className="px-8 py-4">
      <ViewModelPage query={query} />
    </div>
  );
}
