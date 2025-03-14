"use client";
import { FC, useState } from "react";

import { Button, PlusIcon } from "@quri/ui";

import { CreateEvalRunnerModal } from "./CreateEvalRunnerModal";

export const CreateEvalRunnerButton: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <div className="flex items-center gap-1">
          <PlusIcon size={16} />
          Create Eval Runner
        </div>
      </Button>

      {isModalOpen && (
        <CreateEvalRunnerModal close={() => setIsModalOpen(false)} />
      )}
    </>
  );
};
