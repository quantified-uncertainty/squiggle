import { PropsWithChildren } from "react";

import { WithMenuLayout } from "@/components/layout/WithMenuLayout";

import { FrontpageNav } from "./FrontpageNav";

export default function FrontPageLayout({ children }: PropsWithChildren) {
  return <WithMenuLayout menu={<FrontpageNav />}>{children}</WithMenuLayout>;
}
