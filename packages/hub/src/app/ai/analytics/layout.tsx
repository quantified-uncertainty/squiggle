import { PropsWithChildren } from "react";

import { checkRootUser } from "@/server/helpers";

import { AiAnalyticsClientLayout } from "./ClientLayout";

export default async function ({ children }: PropsWithChildren) {
  await checkRootUser();
  return <AiAnalyticsClientLayout>{children}</AiAnalyticsClientLayout>;
}
