import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { NewGroup } from "./NewGroup";

export default function OuterNewGroupPage() {
  return (
    <NarrowPageLayout>
      <NewGroup />
    </NarrowPageLayout>
  );
}

export const metadata: Metadata = {
  title: "New group",
};
