import { HomeLayout } from "fumadocs-ui/home-layout";
import type { PropsWithChildren } from "react";

import { baseOptions } from "../../layout.config";

export default function Layout({ children }: PropsWithChildren) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
