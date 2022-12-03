import { SqProject } from "./index";

// TODO - we should keep the persistent graph and reverse graph of dependencies for better performance.

const dfs = ({
  getEdges,
  visited = new Set(),
  from,
  result,
}: {
  getEdges: (id: string) => string[];
  visited?: Set<string>;
  from: string;
  result: string[]; // will be modified
}) => {
  const _dfs = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dependencyId of getEdges(id)) {
      if (visited.has(dependencyId)) continue;
      _dfs(dependencyId);
    }
    result.push(id);
  };
  _dfs(from);
};

export const getRunOrder = (project: SqProject): string[] => {
  const visited = new Set<string>();
  const runOrder: string[] = [];
  for (const sourceId of project.getSourceIds()) {
    dfs({
      getEdges: (id) => project.getImmediateDependencies(id),
      visited,
      from: sourceId,
      result: runOrder,
    });
  }
  return runOrder;
};

export const getRunOrderFor = (
  project: SqProject,
  sourceId: string
): string[] => {
  const result: string[] = [];
  dfs({
    getEdges: (id) => project.getImmediateDependencies(id),
    from: sourceId,
    result,
  });
  return result;
};

export const getDependencies = (
  project: SqProject,
  sourceId: string
): string[] => {
  const runOrder = getRunOrderFor(project, sourceId);

  // sourceId is the last item of runOrder, but I didn't want to add an assertion
  return runOrder.filter((id) => id !== sourceId);
};

const getInverseGraph = (project: SqProject) => {
  const graph = new Map<string, string[]>();
  for (const id of project.getSourceIds()) {
    const dependencies = project.getImmediateDependencies(id);
    for (const dependencyId of dependencies) {
      const edges = graph.get(dependencyId) ?? [];
      edges.push(id);
      graph.set(dependencyId, edges);
    }
  }
  return graph;
};

export const getDependents = (
  project: SqProject,
  sourceId: string
): string[] => {
  // We'll need the inverse graph for this.
  const graph = getInverseGraph(project);

  const result: string[] = [];
  // TODO - it would be more appropriate to do bfs, but dfs+reverse allows to reuse the existing code
  dfs({
    getEdges: (id) => graph.get(id) ?? [],
    from: sourceId,
    result,
  });

  return result.filter((id) => id !== sourceId).reverse();
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
