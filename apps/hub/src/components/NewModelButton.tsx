import { FC } from "react";

import { PlusIcon } from "@quri/ui";

import { LinkButton } from "@/components/ui/LinkButton";
import { newModelRoute } from "@/lib/routes";

// used on the group page, user page and frontpage
export const NewModelButton: FC<{ group?: string }> = ({ group }) => {
  const link = newModelRoute({ group });

  return (
    <LinkButton href={link} theme="primary">
      <div className="flex items-center gap-1">
        <PlusIcon size={16} />
        New Model
      </div>
    </LinkButton>
  );
};
