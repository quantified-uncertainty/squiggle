"use client";
import { useSelectedLayoutSegment } from "next/navigation";
import { FC } from "react";

import { PlusIcon } from "@quri/ui";

import { LinkButton } from "@/components/ui/LinkButton";
import { newModelRoute } from "@/lib/routes";

export const NewModelButton: FC<{ group: string }> = ({ group }) => {
  const segment = useSelectedLayoutSegment();

  const link = newModelRoute({ group });

  if (segment === "members" || segment === "invite-link") {
    return null;
  }

  return (
    <LinkButton href={link}>
      <div className="flex items-center gap-1">
        <PlusIcon size={16} />
        New Model
      </div>
    </LinkButton>
  );
};
