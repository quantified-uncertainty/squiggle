import { FC } from "react";

import { EntityCard, UpdatedStatus } from "@/components/EntityCard";
import { relativeValuesRoute } from "@/routes";
import { RelativeValuesDefinitionCardData } from "@/server/relative-values/data";

type Props = {
  definition: RelativeValuesDefinitionCardData;
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
