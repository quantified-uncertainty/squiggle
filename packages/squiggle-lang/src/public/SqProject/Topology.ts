import { SqProject } from "./index.js";

// TODO - we should keep the persistent graph and reverse graph of dependencies for better performance.

// Depth-first search.
function dfs({
  getEdges,
  visited = new Set(),
  from,
  act,
}: {
  getEdges: (id: string) => string[];
  visited?: Set<string>;
  from: string;
  act: (id: string) => void;
}) {
  const _dfs = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dependencyId of getEdges(id)) {
      if (visited.has(dependencyId)) continue;
      _dfs(dependencyId);
    }
    act(id);
  };
  _dfs(from);
}

export function getRunOrder(project: SqProject): string[] {
  const visited = new Set<string>();
  const runOrder: string[] = [];
  for (const sourceId of project.getSourceIds()) {
    dfs({
      getEdges: (id) => project.getDependencies(id),
      visited,
      from: sourceId,
      act: (id) => runOrder.push(id),
    });
  }
  return runOrder;
}

export function getRunOrderFor(project: SqProject, sourceId: string): string[] {
  const result: string[] = [];
  dfs({
    getEdges: (id) => project.getDependencies(id),
    from: sourceId,
    act: (id) => result.push(id),
  });
  return result;
}

// unused
export function getDeepDependencies(
  project: SqProject,
  sourceId: string
): string[] {
  const runOrder = getRunOrderFor(project, sourceId);

  // `sourceId` should be the last item of runOrder, but I didn't want to add an assertion,
  // to protect against weird bugs.
  return runOrder.filter((id) => id !== sourceId);
}

function getInverseGraph(project: SqProject) {
  const graph = new Map<string, string[]>();
  for (const id of project.getSourceIds()) {
    const dependencies = project.getDependencies(id);
    for (const dependencyId of dependencies) {
      const edges = graph.get(dependencyId) ?? [];
      edges.push(id);
      graph.set(dependencyId, edges);
    }
  }
  return graph;
}

export function traverseDependents(
  project: SqProject,
  sourceId: string,
  act: (id: string) => void
): void {
  // We'll need the inverse graph for this.
  const graph = getInverseGraph(project);

  // TODO - it would be more appropriate to do bfs, but dfs+reverse allows to reuse the existing code
  dfs({
    getEdges: (id) => graph.get(id) ?? [],
    from: sourceId,
    act: (id) => {
      if (id === sourceId) {
        return;
      }
      act(id);
    },
  });
}

export function getDependents(project: SqProject, sourceId: string): string[] {
  const graph = getInverseGraph(project);

  return graph.get(sourceId) ?? [];
}
