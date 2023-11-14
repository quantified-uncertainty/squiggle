"use client";

import { FC } from "react";
import { useParams, usePathname } from "next/navigation";
import { EntityInfo } from "@/components/EntityInfo";
import { CodeBracketIcon, EmptyIcon, ScaleIcon, ShareIcon } from "@quri/ui";
import { type EntityNode } from "@/components/EntityLayout";
import { ownerIcon } from "@/lib/ownerIcon";
import {
  modelExportRoute,
  modelForRelativeValuesExportRoute,
  modelRoute,
  ownerRoute,
  isModelRelativeValuesRoute,
} from "@/routes";

function hasTypename(owner: {
  __typename?: string;
  slug: string;
}): owner is { __typename: string; slug: string } {
  return Boolean(owner.__typename);
}

function entityNodes(
  owner: {
    // can be undefined in FallbackLayout, when model is not loaded yet.
    __typename?: string;
    slug: string;
  },
  slug: string,
  variable?: {
    name: string;
    type: "RELATIVE_VALUE" | "EXPORT";
  }
): EntityNode[] {
  const ownerNode: EntityNode = { slug: owner.slug };
  if (hasTypename(owner)) {
    ownerNode.href = ownerRoute(owner);
    ownerNode.icon = ownerIcon(owner.__typename);
  } else {
    ownerNode.icon = EmptyIcon;
  }

  const nodes: EntityNode[] = [
    ownerNode,
    {
      slug,
      href: modelRoute({ owner: owner.slug, slug }),
      icon: CodeBracketIcon,
    },
  ];

  if (variable && variable.type === "RELATIVE_VALUE") {
    nodes.push({
      slug: variable.type,
      href: modelForRelativeValuesExportRoute({
        owner: owner.slug,
        slug,
        variableName: variable.name,
      }),
      icon: ScaleIcon,
    });
  }

  if (variable && variable.type === "EXPORT") {
    nodes.push({
      slug: variable.name,
      href: modelExportRoute({
        owner: owner.slug,
        slug,
        variableName: variable.name,
      }),
      icon: ShareIcon,
    });
  }
  return nodes;
}

type Props = {
  owner: {
    // can be undefined in FallbackLayout, when model is not loaded yet.
    __typename?: string;
    slug: string;
  };
};

export const ModelEntityNodes: FC<Props> = ({ owner }) => {
  const pathname = usePathname();
  const { slug, variableName } = useParams<{
    slug: string;
    variableName?: string;
  }>();

  return (
    <EntityInfo
      nodes={entityNodes(
        owner,
        slug,
        (variableName && {
          name: variableName,
          type: isModelRelativeValuesRoute(pathname)
            ? "RELATIVE_VALUE"
            : "EXPORT",
        }) ||
          undefined
      )}
    />
  );
};
