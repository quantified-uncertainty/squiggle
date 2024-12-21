import { Metadata } from "next";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { WithAuth } from "@/components/WithAuth";

import { NewDefinition } from "./NewDefinition";

export default function OuterNewModelDefinitionPage() {
  return (
    <WithAuth>
      <NarrowPageLayout>
        <NewDefinition />
      </NarrowPageLayout>
    </WithAuth>
  );
}

export const metadata: Metadata = {
  title: "New definition",
};
