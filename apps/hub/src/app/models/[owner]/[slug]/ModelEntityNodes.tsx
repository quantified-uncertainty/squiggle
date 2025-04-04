"use client";

import { useParams, usePathname } from "next/navigation";
import { FC } from "react";

import { CodeBracketSquareIcon, EmptyIcon, ShareIcon } from "@quri/ui";

import { EntityInfo } from "@/components/EntityInfo";
import { type EntityNode } from "@/components/EntityLayout";
import { ownerIcon } from "@/lib/ownerIcon";
import {
  isModelRelativeValuesRoute,
  modelForRelativeValuesExportRoute,
  modelRoute,
  ownerRoute,
  variableRoute,
} from "@/lib/routes";

function hasTypename(owner: {
  kind?: "User" | "Group";
  slug: string;
}): owner is { kind: "User" | "Group"; slug: string } {
  return Boolean(owner.kind);
}

function entityNodes(
  owner: {
    // can be undefined in FallbackLayout, when model is not loaded yet.
    kind?: "User" | "Group";
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
    ownerNode.icon = ownerIcon(owner.kind);
  } else {
    ownerNode.icon = EmptyIcon;
  }

  const nodes: EntityNode[] = [
    ownerNode,
    {
      slug,
      href: modelRoute({ owner: owner.slug, slug }),
      icon: CodeBracketSquareIcon,
    },
  ];

  if (variable && variable.type === "RELATIVE_VALUE") {
    nodes.push({
      slug: variable.name,
      href: modelForRelativeValuesExportRoute({
        owner: owner.slug,
        slug,
        variableName: variable.name,
      }),
    });
  }

  if (variable && variable.type === "EXPORT") {
    nodes.push({
      slug: variable.name,
      href: variableRoute({
        owner: owner.slug,
        modelSlug: slug,
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
    kind?: "User" | "Group";
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
