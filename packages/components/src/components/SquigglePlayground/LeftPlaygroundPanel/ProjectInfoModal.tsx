import { FC } from "react";

import { SqProject } from "@quri/squiggle-lang";

// Passing settings as prop sacrifices react-hook-form performance optimizations, but that's not very important.
export const ProjectInfoModal: FC<{
  project: SqProject;
}> = ({ project }) => {
  return (
    <div>
      <ul>
        {project.getSourceIds().map((sourceId) => (
          <li key={sourceId}>{sourceId}</li>
        ))}
      </ul>
    </div>
  );
};
