"use client";

import { FC, PropsWithChildren } from "react";

import { EntityLayout } from "@/components/EntityLayout";

import { ModelEntityNodes } from "./ModelEntityNodes";

type Props = PropsWithChildren<{
  username: string;
  slug: string;
}>;

export const FallbackModelLayout: FC<Props> = ({
  username,
  slug,
  children,
}) => {
  return (
    <EntityLayout
      // Note that we don't pass `kind` here.
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
    >
      {children}
    </EntityLayout>
  );
};
