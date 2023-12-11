"use client";

import { FC } from "react";

import { EntityLayout } from "@/components/EntityLayout";

import { ModelEntityNodes } from "./ModelEntityNodes";

type Props = {
  username: string;
  slug: string;
};

export const FallbackModelLayout: FC<Props> = ({ username, slug }) => {
  return (
    <EntityLayout
      // Note that we don't pass `__typename` here.
      // This causes an entity node to not have an icon or a link until the owner type is known.
      nodes={<ModelEntityNodes owner={{ slug: username }} />}
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
