import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { NewModel } from "./NewModel";

export default function NewModelPage() {
  return (
    <NarrowPageLayout>
      <NewModel />
    </NarrowPageLayout>
  );
}

export const metadata: Metadata = {
  title: "New model",
};
