import { createContext, useContext } from "react";

type ProjectContextShape = {
  sourceId: string;
  getUrl?: (sourceId: string, varName?: string) => string;
};

export const ProjectContext = createContext<ProjectContextShape>({
  sourceId: "",
  getUrl: undefined,
});

export function useProjectContext() {
  return useContext(ProjectContext);
}
