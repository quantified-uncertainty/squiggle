import QueryNode, {
  FrontPageQuery,
} from "@/__generated__/FrontPageQuery.graphql";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { FrontPage } from "./FrontPage";

export default async function OuterFrontPage() {
  const query = await loadPageQuery<FrontPageQuery>(QueryNode, {});

  return (
    <NarrowPageLayout>
      <FrontPage query={query} />
    </NarrowPageLayout>
  );
}
