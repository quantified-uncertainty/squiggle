import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H1 } from "@/components/ui/Headers";

export default function StatusLayout({ children }: PropsWithChildren) {
  return (
    <NarrowPageLayout>
      <div>
        <H1>Global statistics</H1>
        {children}
      </div>
    </NarrowPageLayout>
  );
}
