import { Metadata } from "next";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { UpgradeVersionsPage } from "./UpgradeVersionsPage";

import QueryNode, {
  UpgradeVersionsPageQuery,
} from "@/__generated__/UpgradeVersionsPageQuery.graphql";

export default async function OuterUpgradeVersionsPage() {
  // permissions are checked in ./layout.tsx
  const query = await loadPageQuery<UpgradeVersionsPageQuery>(QueryNode, {});

  return <UpgradeVersionsPage query={query} />;
}

export const metadata: Metadata = {
  title: "Admin",
};
