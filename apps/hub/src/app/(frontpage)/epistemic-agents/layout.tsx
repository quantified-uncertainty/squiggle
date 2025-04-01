import { PropsWithChildren } from "react";

import { EpistemicAgentsHelp } from "@/app/evals/EpistemicAgentsHelp";
import { CreateEpistemicAgentButton } from "@/evals/components/CreateEpistemicAgentButton";
import { auth } from "@/lib/server/auth";

import { MainAreaLayout } from "../../../components/layout/MainAreaLayout";

export default async function EpistemicAgentsLayout({
  children,
}: PropsWithChildren) {
  const session = await auth();

  return (
    <MainAreaLayout
      title="Epistemic Agents"
      help={<EpistemicAgentsHelp />}
      actions={session && <CreateEpistemicAgentButton />}
    >
      {children}
    </MainAreaLayout>
  );
}
