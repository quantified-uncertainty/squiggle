"use client";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { FC } from "react";

import { Button, PlusIcon } from "@quri/ui";

import { newDefinitionRoute, newGroupRoute, newModelRoute } from "@/routes";

export const NewModelButton: FC = () => {
  const segment = useSelectedLayoutSegment();

  let link = newModelRoute();
  let text = "New Model";

  if (segment === "groups") {
    link = newGroupRoute();
    text = "New Group";
  } else if (segment === "definitions") {
    link = newDefinitionRoute();
    text = "New Definition";
  }

  const router = useRouter();

  return (
    <Button onClick={() => router.push(link)}>
      <div className="flex items-center gap-1">
        <PlusIcon size={16} />
        {text}
      </div>
    </Button>
  );
};
