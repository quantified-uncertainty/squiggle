import { PropsWithChildren } from "react";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";

export default function EpistemicAgentLayout({ children }: PropsWithChildren) {
  return <FullLayoutWithPadding>{children}</FullLayoutWithPadding>;
}
