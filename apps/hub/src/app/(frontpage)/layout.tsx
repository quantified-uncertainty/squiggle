import { PropsWithChildren } from "react";

import { FrontpageNav } from "@/components/FrontpageNav";
import { WithNavMenuLayout } from "@/components/layout/WithNavMenuLayout";

export default function FrontPageLayout({ children }: PropsWithChildren) {
  return (
    <WithNavMenuLayout menu={<FrontpageNav />}>{children}</WithNavMenuLayout>
  );
}
