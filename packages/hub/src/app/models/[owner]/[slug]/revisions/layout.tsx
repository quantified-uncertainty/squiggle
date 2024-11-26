import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

export default function ModelRevisionsLayout({ children }: PropsWithChildren) {
  return (
    <NarrowPageLayout>
      <div className="mb-2 mt-4 font-medium">Revision history</div>
      {children}
    </NarrowPageLayout>
  );
}
