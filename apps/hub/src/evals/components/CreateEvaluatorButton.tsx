"use client";
import { FC, useState } from "react";

import { Button, PlusIcon } from "@quri/ui";

import { CreateEvaluatorModal } from "./CreateEvaluatorModal";

export const CreateEvaluatorButton: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <div className="flex items-center gap-1">
          <PlusIcon size={16} />
          Create Evaluator
        </div>
      </Button>

      {isModalOpen && (
        <CreateEvaluatorModal close={() => setIsModalOpen(false)} />
      )}
    </>
  );
};
