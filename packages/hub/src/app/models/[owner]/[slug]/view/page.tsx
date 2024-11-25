import { loadPageQuery } from "@/relay/loadPageQuery";

import { ViewModelPage } from "./ViewModelPage";

import QueryNode, {
  ViewModelPageQuery,
} from "@/__generated__/ViewModelPageQuery.graphql";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

export default async function OuterModelPage({ params }: Props) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<ViewModelPageQuery>(QueryNode, {
    input: { owner, slug },
  });

  return (
    <div className="px-8 py-4">
      <ViewModelPage query={query} />
    </div>
  );
}
