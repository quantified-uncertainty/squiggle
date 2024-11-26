import { PropsWithChildren } from "react";

import { WithAuth } from "@/components/WithAuth";

import { AiAnalyticsClientLayout } from "./ClientLayout";

export default async function ({ children }: PropsWithChildren) {
  return (
    <WithAuth rootOnly>
      <AiAnalyticsClientLayout>{children}</AiAnalyticsClientLayout>
    </WithAuth>
  );
}
