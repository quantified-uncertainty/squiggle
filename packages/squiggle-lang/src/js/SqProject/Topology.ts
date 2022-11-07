import { SqProject } from "./index";

export const getRunOrder = (project: SqProject): string[] => {
  const visited = new Set<string>();
  const runOrder: string[] = [];
  const dfs = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dependencyId of project.getImmediateDependencies(id)) {
      if (visited.has(dependencyId)) continue;
      dfs(dependencyId);
    }
    runOrder.push(id);
  };

  for (const sourceId of project.getSourceIds()) {
    dfs(sourceId);
  }
  return runOrder;
};

export const getRunOrderFor = (
  project: SqProject,
  sourceId: string
): string[] => {
  const visited = new Set<string>();
  const runOrder: string[] = [];
  const dfs = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dependencyId of project.getImmediateDependencies(id)) {
      if (visited.has(dependencyId)) continue;
      dfs(dependencyId);
    }
    runOrder.push(id);
  };
  dfs(sourceId);

  return runOrder;
};

export const getDependencies = (
  project: SqProject,
  sourceId: string
): string[] => {
  const runOrder = getRunOrder(project);
  const index = runOrder.indexOf(sourceId);
  return runOrder.slice(0, index); // FIXME - this returns extra stuff
};

export const getDependents = (
  project: SqProject,
  sourceId: string
): string[] => {
  const runOrder = getRunOrder(project);
  const index = runOrder.indexOf(sourceId);
  return runOrder.slice(index + 1); // FIXME - this returns extra stuff
};

export const runOrderDiff = (
  current: string[],
  previous: string[]
): string[] => {
  const affected: string[] = [];
  let eq = true;
  for (let i = 0; i < current.length; i++) {
    if (!eq || i >= previous.length || previous[i] !== current[i]) {
      eq = false;
      affected.push(current[i]);
    }
  }
  return affected;
};
