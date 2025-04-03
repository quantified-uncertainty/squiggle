"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { Button, PlusIcon } from "@quri/ui";

import { createQuestionSetRoute } from "@/lib/routes";

export const LayoutActions: FC = () => {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        router.push(createQuestionSetRoute());
      }}
      theme="primary"
    >
      <div className="flex items-center gap-1">
        <PlusIcon size={16} />
        New Question Set
      </div>
    </Button>
  );
};
