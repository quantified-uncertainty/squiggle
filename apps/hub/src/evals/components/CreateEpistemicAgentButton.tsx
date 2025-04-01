"use client";
import { FC } from "react";
import { useRouter } from "next/navigation";

import { Button, PlusIcon } from "@quri/ui";

import { createEpistemicAgentRoute } from "@/lib/routes";

export const CreateEpistemicAgentButton: FC = () => {
  const router = useRouter();

  return (
    <Button onClick={() => router.push(createEpistemicAgentRoute())}>
      <div className="flex items-center gap-1">
        <PlusIcon size={16} />
        Create Epistemic Agent
      </div>
    </Button>
  );
};