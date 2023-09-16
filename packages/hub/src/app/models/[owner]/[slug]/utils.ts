import { CodeBracketIcon, EmptyIcon, ScaleIcon } from "@quri/ui";

import { type EntityNode } from "@/components/EntityLayout";
import { ownerIcon } from "@/lib/ownerIcon";
import {
  modelForRelativeValuesExportRoute,
  modelRoute,
  ownerRoute,
} from "@/routes";

function hasTypename(owner: {
  __typename?: string;
  slug: string;
}): owner is { __typename: string; slug: string } {
  return Boolean(owner.__typename);
}

export function entityNodes(
  owner: {
    // can be undefined in FallbackLayout, when model is not loaded yet.
    __typename?: string;
    slug: string;
  },
  slug: string,
  variableName?: string
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

  if (variableName) {
    nodes.push({
      slug: variableName,
      href: modelForRelativeValuesExportRoute({
        owner: owner.slug,
        slug,
        variableName,
      }),
      icon: ScaleIcon,
    });
  }
  return nodes;
}
