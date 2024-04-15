import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

import { SearchPage } from "./searchPage";

export default async function OuterFrontPage() {
  return (
    <NarrowPageLayout>
      <SearchPage />
    </NarrowPageLayout>
  );
}

export const metadata: Metadata = {
  title: "Status",
};
