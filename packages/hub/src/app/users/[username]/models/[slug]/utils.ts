import { type EntityNode } from "@/components/EntityLayout";
import {
  modelForRelativeValuesExportRoute,
  modelRoute,
  userRoute,
} from "@/routes";
import { CodeBracketIcon, ScaleIcon } from "@quri/ui";

export const entityNodes = (
  username: string,
  slug: string,
  variableName?: string
): EntityNode[] => {
  const nodes: EntityNode[] = [
    { slug: username, href: userRoute({ username }) },
    { slug, href: modelRoute({ username, slug }), icon: CodeBracketIcon },
  ];
  if (variableName) {
    nodes.push({
      slug: variableName,
      href: modelForRelativeValuesExportRoute({
        username,
        slug,
        variableName,
      }),
      icon: ScaleIcon,
    });
  }
  return nodes;
};
