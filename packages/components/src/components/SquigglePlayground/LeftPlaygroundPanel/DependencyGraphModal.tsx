import { FC, lazy } from "react";

import { SqProject } from "@quri/squiggle-lang";

const Mermaid = lazy(() => import("../../ui/Mermaid.js"));

export const DependencyGraphModal: FC<{
  project: SqProject;
}> = ({ project }) => {
  const sourceIds = project.getSourceIds();

  let diagram = "graph TD\n";
  for (const sourceId of sourceIds) {
    diagram += `${sourceId}\n`; // for sources that don't have any dependencies
    for (const dependencyId of project.getDependencies(sourceId)) {
      diagram += `${sourceId} --> ${dependencyId}\n`;
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Mermaid>{diagram}</Mermaid>
    </div>
  );
};
