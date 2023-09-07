import { Metadata } from "next";

import QueryNode, {
  StatusPageQuery,
} from "@/__generated__/StatusPageQuery.graphql";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";
import { StatusPage } from "./StatusPage";

export default async function OuterFrontPage() {
  const query = await loadPageQuery<StatusPageQuery>(QueryNode, {});

  return (
    <NarrowPageLayout>
      <StatusPage query={query} />
    </NarrowPageLayout>
  );
}

export const metadata: Metadata = {
  title: "Status",
};
