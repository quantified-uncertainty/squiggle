"use client";

import { EntityLayout } from "@/components/EntityLayout";
import { entityNodes } from "./utils";
import { FC } from "react";
import { useParams } from "next/navigation";

type Props = {
  username: string;
  slug: string;
};

export const FallbackModelLayout: FC<Props> = ({ username, slug }) => {
  const { variableName } = useParams<{ variableName: string }>();

  return (
    <EntityLayout
      nodes={entityNodes(
        // Note that we don't pass `__typename` here.
        // This causes an entity node to not have an icon or a link until the owner type is known.
        { slug: username },
        slug,
        variableName
      )}
      isFluid={true}
      headerRight={
        <div
          style={{
            height: 49, // matches the height of real header content
          }}
        />
      }
    />
  );
};
