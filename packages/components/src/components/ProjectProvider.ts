import { createContext, useContext } from "react";

type ProjectContextShape = {
  sourceId: string;
  onOpenExport?: (sourceId: string, varName?: string) => void;
};

export const ProjectContext = createContext<ProjectContextShape>({
  sourceId: "",
  onOpenExport: undefined,
});

export function useProjectContext() {
  return useContext(ProjectContext);
}
