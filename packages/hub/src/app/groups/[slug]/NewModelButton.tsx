"use client";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { FC } from "react";

import { Button, PlusIcon } from "@quri/ui";

import { newModelRoute } from "@/lib/routes";

// TODO - this could be a server component, if we had `<LinkButton>` component
export const NewModelButton: FC<{ group: string }> = ({ group }) => {
  const segment = useSelectedLayoutSegment();

  const link = newModelRoute({ group });

  const router = useRouter();

  if (segment === "members" || segment === "invite-link") {
    return null;
  }

  return (
    <Button onClick={() => router.push(link)}>
      <div className="flex items-center gap-1">
        <PlusIcon size={16} />
        New Model
      </div>
    </Button>
  );
};
