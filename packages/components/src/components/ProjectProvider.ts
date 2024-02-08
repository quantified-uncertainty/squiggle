import { createContext, useContext } from "react";

type ProjectContextShape = {
  sourceId: string;
  onClickExport?: (sourceId: string, varName?: string) => void;
};

export const ProjectContext = createContext<ProjectContextShape>({
  sourceId: "",
  onClickExport: undefined,
});

export function useProjectContext() {
  return useContext(ProjectContext);
}
