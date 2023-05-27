"use client";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { NewDefinition } from "./NewDefinition";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

export default function NewModelPage() {
  return (
    <NarrowPageLayout>
      <NewDefinition />
    </NarrowPageLayout>
  );
}
