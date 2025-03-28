import { PropsWithChildren } from "react";

import { WithNavMenuLayout } from "@/components/layout/WithNavMenuLayout";

import { FrontpageNav } from "./FrontpageNav";

export default function FrontPageLayout({ children }: PropsWithChildren) {
  return (
    <WithNavMenuLayout menu={<FrontpageNav />}>{children}</WithNavMenuLayout>
  );
}
