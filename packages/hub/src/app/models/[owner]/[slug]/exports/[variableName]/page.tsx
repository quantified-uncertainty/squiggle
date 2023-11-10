import QueryNode, {
  ViewModelPageQuery,
} from "@/__generated__/ViewModelPageQuery.graphql";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { ModelExportPage } from "./modelExportPage";

type Props = {
  params: { owner: string; slug: string };
};

export default async function OuterModelPage({ params }: Props) {
  const query = await loadPageQuery<ViewModelPageQuery>(QueryNode, {
    input: { owner: params.owner, slug: params.slug },
  });

  return (
    <div className="py-4 px-8">
      <ModelExportPage query={query} />
    </div>
  );
}
