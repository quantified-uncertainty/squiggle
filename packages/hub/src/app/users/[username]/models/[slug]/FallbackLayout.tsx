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
  const { variableName } = useParams();

  return (
    <EntityLayout
      nodes={entityNodes(username, slug, variableName)}
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
