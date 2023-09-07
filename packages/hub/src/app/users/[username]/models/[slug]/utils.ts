import { Owner$data } from "@/__generated__/Owner.graphql";
import { type EntityNode } from "@/components/EntityLayout";
import {
  modelForRelativeValuesExportRoute,
  modelRoute,
  ownerRoute,
} from "@/routes";
import { CodeBracketIcon, ScaleIcon } from "@quri/ui";

export function entityNodes(
  owner: Owner$data,
  slug: string,
  variableName?: string
): EntityNode[] {
  const nodes: EntityNode[] = [
    { slug: owner.slug, href: ownerRoute(owner) },
    { slug, href: modelRoute({ owner, slug }), icon: CodeBracketIcon },
  ];
  if (variableName) {
    nodes.push({
      slug: variableName,
      href: modelForRelativeValuesExportRoute({
        owner,
        slug,
        variableName,
      }),
      icon: ScaleIcon,
    });
  }
  return nodes;
}
