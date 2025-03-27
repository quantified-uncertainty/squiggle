import { PropsWithChildren } from "react";

import { CreateEpistemicAgentButton } from "@/evals/components/CreateEpistemicAgentButton";
import { auth } from "@/lib/server/auth";

import { FrontpageMainAreaLayout } from "../FrontpageMainAreaLayout";

export default async function EpistemicAgentsLayout({
  children,
}: PropsWithChildren) {
  const session = await auth();

  return (
    <FrontpageMainAreaLayout
      title="Epistemic Agents"
      actions={session && <CreateEpistemicAgentButton />}
    >
      {children}
    </FrontpageMainAreaLayout>
  );
}
