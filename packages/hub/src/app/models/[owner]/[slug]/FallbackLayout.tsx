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
      nodes={entityNodes(
        // TODO - should we do something else while we don't have backend owner data?
        // Perhaps we render a node as a plain text without a link until then.
        { __typename: "User", slug: username },
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
