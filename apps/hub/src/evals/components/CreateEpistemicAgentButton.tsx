"use client";
import { FC, useState } from "react";

import { Button, PlusIcon } from "@quri/ui";

import { CreateEpistemicAgentModal } from "./CreateEpistemicAgentModal";

export const CreateEpistemicAgentButton: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <div className="flex items-center gap-1">
          <PlusIcon size={16} />
          Create Epistemic Agent
        </div>
      </Button>

      {isModalOpen && (
        <CreateEpistemicAgentModal close={() => setIsModalOpen(false)} />
      )}
    </>
  );
};
