import { type EntityNode } from "@/components/EntityLayout";
import {
  modelForRelativeValuesExportRoute,
  modelRoute,
  ownerRoute,
} from "@/routes";
import { CodeBracketIcon, ScaleIcon } from "@quri/ui";

export function entityNodes(
  owner: { __typename: string; slug: string },
  slug: string,
  variableName?: string
): EntityNode[] {
  const nodes: EntityNode[] = [
    { slug: owner.slug, href: ownerRoute(owner) },
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
