import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { NewGroup } from "./NewGroup";

export default function NewGroupPage() {
  return (
    <NarrowPageLayout>
      <NewGroup />
    </NarrowPageLayout>
  );
}

export const metadata: Metadata = {
  title: "New group",
};
