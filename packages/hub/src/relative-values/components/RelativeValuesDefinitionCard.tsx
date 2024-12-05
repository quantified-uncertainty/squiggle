import { FC } from "react";

import { EntityCard, UpdatedStatus } from "@/components/EntityCard";
import { relativeValuesRoute } from "@/lib/routes";
import { RelativeValuesDefinitionCardDTO } from "@/relative-values/data/cards";

type Props = {
  definition: RelativeValuesDefinitionCardDTO;
  showOwner?: boolean;
};

export const RelativeValuesDefinitionCard: FC<Props> = ({
  definition,
  showOwner = true,
}) => {
  return (
    <EntityCard
      href={relativeValuesRoute({
        owner: definition.owner.slug,
        slug: definition.slug,
      })}
      showOwner={showOwner}
      ownerName={definition.owner.slug}
      slug={definition.slug}
      menuItems={
        <>
          <UpdatedStatus time={definition.updatedAt.getTime()} />
        </>
      }
    />
  );
};
