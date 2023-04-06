import { Map, Set } from "immutable";
import { Catalog, InterfaceWithModels } from "@/types";

type Node = {
  code: string;
  dependencies: string[];
};

type ModelMetadata = {
  id: string;
  author: string;
  title: string;
  modified?: boolean;
};

export type TextModel = {
  mode: "text";
  code: string;
} & ModelMetadata;

export type GraphModel = {
  mode: "graph";
  commonCode: string;
  nodes: Map<string, Node>;
  invalidIds: Set<string>;
} & ModelMetadata;

type GraphModelOrder =
  | {
      type: "ok";
      ids: string[];
    }
  | {
      type: "loop";
      invalidIds: Set<string>;
    };

export type Model = TextModel | GraphModel;

function topologicalSort(model: GraphModel): GraphModelOrder {
  const ids: string[] = [];
  let globalSeen = Set<string>();
  let invalidIds = Set<string>();

  for (const id of model.nodes.keys()) {
    let seen = Set<string>();

    // returns the validity status of the current node
    const dfs = (currentId: string): boolean => {
      if (globalSeen.has(currentId)) {
        return !invalidIds.has(currentId);
      }

      if (seen.has(currentId)) {
        invalidIds = invalidIds.add(currentId);
        return false;
      }
      seen = seen.add(currentId);

      let ok = true;
      for (const dependencyId of model.nodes.get(currentId)?.dependencies ||
        []) {
        if (!dfs(dependencyId)) {
          ok = false;
        }
      }

      if (ok) {
        ids.push(currentId);
      } else {
        invalidIds = invalidIds.add(currentId);
      }
      return ok;
    };

    dfs(id);

    globalSeen = globalSeen.union(seen.keys());
  }

  if (invalidIds.size) {
    return {
      type: "loop",
      invalidIds,
    };
  }

  return {
    type: "ok",
    ids,
  };
}

export function getGraphModelCode(model: GraphModel) {
  const sortResult = topologicalSort(model);

  if (sortResult.type === "loop") {
    return "// Circular dependency";
  }

  let code = `// Common code\n${model.commonCode}\n\n`;
  for (let id of sortResult.ids) {
    const node = model.nodes.get(id);

    if (!node) {
      throw new Error(`Node ${id} not found`);
    }
    // TODO - add comments with item names
    code += `${id} = { ${node.code} }\n`;
  }

  code +=
    "\nitems = {\n" +
    sortResult.ids.map((id) => `  ${id}: ${id}`).join(",\n") +
    "\n}\n";

  code += `
withSampleSetValue(item) = SampleSet.fromDist(item)
items = Dict.map(items, withSampleSetValue)

fn(intervention1, intervention2) = [items[intervention1], items[intervention2]]
`;

  return code;
}

export function getModelCode(model: Model) {
  if (model.mode === "text") {
    return model.code;
  } else {
    return getGraphModelCode(model);
  }
}

function findIdsInCode(code: string, catalog: Catalog) {
  const ids: string[] = [];
  for (let item of catalog.items) {
    if (code.match(`\\b${item.id}\\b`)) {
      ids.push(item.id);
    }
  }
  return ids;
}

export function updateModelCommonCode({
  model,
  code,
}: {
  model: GraphModel;
  code: string;
}) {
  return {
    ...model,
    commonCode: code,
  };
}

function findInvalidIds(model: GraphModel): GraphModel {
  const sorted = topologicalSort(model);
  return {
    ...model,
    invalidIds: sorted.type === "loop" ? sorted.invalidIds : Set(),
  };
}

export function updateModelNode({
  model,
  nodeId,
  code,
  catalog,
}: {
  model: GraphModel;
  nodeId: string;
  code: string;
  catalog: Catalog;
}): GraphModel {
  return findInvalidIds({
    ...model,
    nodes: model.nodes.set(nodeId, {
      code,
      dependencies: findIdsInCode(code, catalog),
    }),
  });
}

export function buildGraphModel({
  items,
  catalog,
  commonCode = "",
  metadata,
}: {
  items: [string, string][];
  commonCode: string;
  metadata: ModelMetadata;
  catalog: Catalog;
}): GraphModel {
  const result = {
    mode: "graph",
    commonCode,
    nodes: Map(
      items.map(([id, code]) => [
        id,
        {
          code,
          dependencies: findIdsInCode(code, catalog),
        },
      ])
    ),
    invalidIds: Set(),
    ...metadata,
  } satisfies GraphModel;

  return findInvalidIds(result);
}

export function modelToJSON(model: Model) {
  if (model.mode === "text") {
    return model;
  }

  return {
    ...model,
    nodes: [...model.nodes.entries()],
    invalidIds: [...model.invalidIds.values()],
  };
}

export function modelFromJSON(json: any) {
  // TODO - validate
  if (json.mode === "text") {
    return json;
  }

  return {
    ...json,
    nodes: Map(json.nodes),
    invalidIds: Set(json.invalidIds),
  };
}

export function createEmptyGraphModel({
  author,
  title,
  id,
  catalog,
}: {
  id: string;
  author: string;
  title: string;
  catalog: Catalog;
}) {
  return buildGraphModel({
    items: catalog.items.map((item) => [item.id, "pointMass(1)"]),
    commonCode: "",
    metadata: {
      author,
      title,
      id,
    },
    catalog,
  });
}
