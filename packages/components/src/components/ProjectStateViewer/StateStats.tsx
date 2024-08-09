import { FC } from "react";

import { SqProject } from "@quri/squiggle-lang";

export const StateStats: FC<{ project: SqProject }> = ({ project }) => {
  return (
    <div className="pb-2 text-xs">
      {project.state.heads.size} heads, {project.state.modules.size} modules,{" "}
      {project.state.outputs.size} outputs
    </div>
  );
};
