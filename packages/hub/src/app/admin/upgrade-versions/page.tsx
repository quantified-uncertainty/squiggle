import { Metadata } from "next";

import { loadModelsByVersion } from "@/server/models/data/byVersion";
import { checkRootUser } from "@/server/users/auth";

import { UpgradeVersionsPage } from "./UpgradeVersionsPage";

export default async function OuterUpgradeVersionsPage() {
  await checkRootUser();

  // TODO - this fetches all models even if we show just one, can we optimize it?
  const data = await loadModelsByVersion();

  return <UpgradeVersionsPage modelsByVersion={data} />;
}

export const metadata: Metadata = {
  title: "Admin",
};
