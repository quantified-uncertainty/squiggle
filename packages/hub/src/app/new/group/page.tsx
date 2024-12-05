import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { WithAuth } from "@/components/WithAuth";

import { NewGroup } from "./NewGroup";

export default function OuterNewGroupPage() {
  return (
    <WithAuth>
      <NarrowPageLayout>
        <NewGroup />
      </NarrowPageLayout>
    </WithAuth>
  );
}

export const metadata: Metadata = {
  title: "New group",
};
