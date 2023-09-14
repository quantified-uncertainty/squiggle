import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { NewDefinition } from "./NewDefinition";

export default function OuterNewModelDefinitionPage() {
  return (
    <NarrowPageLayout>
      <NewDefinition />
    </NarrowPageLayout>
  );
}

export const metadata: Metadata = {
  title: "New definition",
};
