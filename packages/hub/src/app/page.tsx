"use client";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { FrontPage } from "./FrontPage";

export default function OuterFrontPage() {
  return (
    <NarrowPageLayout>
      <FrontPage />
    </NarrowPageLayout>
  );
}
