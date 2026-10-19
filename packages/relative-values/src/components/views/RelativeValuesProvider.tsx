"use client";
import { Set } from "immutable";
import {
  createContext,
  FC,
  PropsWithChildren,
  ReactNode,
  Reducer,
  useContext,
  useMemo,
} from "react";

import { SqLinker } from "@quri/squiggle-lang";
import { generateProvider } from "@quri/ui";

import { Clusters, Item, RelativeValuesDefinition } from "../../types.js";
import { ModelEvaluator } from "../../values/ModelEvaluator.js";
import { Filter } from "./types.js";

export type Axis = "rows" | "columns";

export type GridMode = "full" | "half";

export type SortMode = "default" | "median" | "uncertainty" | "similarity";

export type SortConfig = {
  mode: SortMode;
  desc: boolean;
};

export type AxisConfig = {
  filter: Filter;
  sort: SortConfig;
};

type ViewContextShape = {
  gridMode: GridMode;
  axisConfig: { [k in Axis]: AxisConfig };
};

export type RelativeValuesOptions = {
  // If set, the list view sidebar shows an "Open in Playground" link.
  getPlaygroundUrl?: (code: string) => string;
  // Resolves imports in the per-pair Squiggle charts of the list view sidebar
  // (which re-run the model code). Without it, models with imports can't show
  // these charts.
  linker?: SqLinker;
  // Source id of the model, passed to the linker as the importing module's id
  // so that relative imports (`import "./other.squiggle"`) resolve.
  sourceId?: string;
  // Called when an item name is clicked in the list view, the grid headers or
  // the list sidebar, or when an item's dot is clicked in the plots. Without
  // it, clicking a name in the list view makes it the unit of comparison.
  onItemClick?: (item: Item) => void;
  // Custom rendering of item names, e.g. a link to the item's page in your app.
  // Defaults to `item.name`.
  renderItemName?: (item: Item) => ReactNode;
};

type DataContextShape = {
  evaluator: ModelEvaluator;
  definition: RelativeValuesDefinition;
  options: RelativeValuesOptions;
};

const DataContext = createContext<DataContextShape | null>(null);

const defaultAxisConfig: AxisConfig = {
  filter: {
    selectedClusters: Set(),
  },
  sort: {
    mode: "default",
    desc: false,
  },
};

const defaultValue: ViewContextShape = {
  gridMode: "full",
  axisConfig: {
    rows: defaultAxisConfig,
    columns: defaultAxisConfig,
  },
};

type Action =
  | {
      type: "toggleCluster";
      payload: {
        axis: "rows" | "columns";
        id: string;
      };
    }
  | {
      type: "toggleClusterCombination";
      payload: {
        row: string;
        column: string;
      };
    }
  | {
      type: "setSort";
      payload: {
        axis: "rows" | "columns";
        sort: SortConfig;
      };
    }
  | {
      type: "setGridMode";
      payload: GridMode;
    };

const toggle = (set: Set<string>, id: string) =>
  set.has(id) ? set.delete(id) : set.add(id);

const reducer: Reducer<ViewContextShape, Action> = (state, action) => {
  switch (action.type) {
    case "toggleCluster": {
      const axisConfig = state.axisConfig[action.payload.axis];
      return {
        ...state,
        axisConfig: {
          ...state.axisConfig,
          [action.payload.axis]: {
            ...axisConfig,
            filter: {
              ...axisConfig.filter,
              selectedClusters: toggle(
                axisConfig.filter.selectedClusters,
                action.payload.id
              ),
            },
          },
        },
      };
    }
    case "toggleClusterCombination": {
      const axisConfig = state.axisConfig;
      return {
        ...state,
        axisConfig: {
          ...state.axisConfig,
          rows: {
            ...axisConfig.rows,
            filter: {
              ...axisConfig.rows.filter,
              selectedClusters: Set([action.payload.row]),
            },
          },
          columns: {
            ...axisConfig.columns,
            filter: {
              ...axisConfig.columns.filter,
              selectedClusters: Set([action.payload.column]),
            },
          },
        },
      };
    }
    case "setSort": {
      const axisConfig = state.axisConfig[action.payload.axis];
      return {
        ...state,
        axisConfig: {
          ...state.axisConfig,
          [action.payload.axis]: {
            ...axisConfig,
            sort: action.payload.sort,
          },
        },
      };
    }
    case "setGridMode":
      return {
        ...state,
        gridMode: action.payload,
      };
    default:
      return state;
  }
};

const {
  Provider,
  useContext: useRelativeValuesViewContext,
  useDispatch: useRelativeValuesDispatch,
} = generateProvider({
  name: "View",
  reducer,
  defaultValue,
});

export type RelativeValuesProviderProps = PropsWithChildren<
  {
    definition: RelativeValuesDefinition;
    evaluator: ModelEvaluator;
  } & RelativeValuesOptions
>;

export const RelativeValuesProvider: FC<RelativeValuesProviderProps> = ({
  evaluator,
  definition,
  getPlaygroundUrl,
  linker,
  sourceId,
  onItemClick,
  renderItemName,
  children,
}) => {
  const data = useMemo(
    () => ({
      evaluator,
      definition,
      options: {
        getPlaygroundUrl,
        linker,
        sourceId,
        onItemClick,
        renderItemName,
      },
    }),
    [
      evaluator,
      definition,
      getPlaygroundUrl,
      linker,
      sourceId,
      onItemClick,
      renderItemName,
    ]
  );

  // Reset filters when the set of clusters changes.
  const clustersKey = definition.clusters
    .map((cluster) => cluster.id)
    .join("\n");

  return (
    <DataContext.Provider value={data}>
      <Provider
        key={clustersKey}
        generateInitialValue={() => {
          const clusterIds = Set<string>(
            definition.clusters.map((cluster) => cluster.id)
          );
          const axisConfig: AxisConfig = {
            filter: { selectedClusters: clusterIds },
            sort: { mode: "default", desc: false },
          };

          return {
            gridMode: "full",
            axisConfig: {
              rows: axisConfig,
              columns: axisConfig,
            },
          };
        }}
      >
        {children}
      </Provider>
    </DataContext.Provider>
  );
};

function useRelativeValuesData(): DataContextShape {
  const data = useContext(DataContext);
  if (!data) {
    throw new Error(
      "Relative values components must be used inside RelativeValuesProvider"
    );
  }
  return data;
}

export const useRelativeValuesContext = () => {
  const { evaluator, definition } = useRelativeValuesData();
  const view = useRelativeValuesViewContext();
  return { evaluator, definition, ...view };
};

export const useDefinition = () => {
  return useRelativeValuesData().definition;
};

export const useRelativeValuesOptions = () => {
  return useRelativeValuesData().options;
};

export const useEvaluator = () => {
  return useRelativeValuesData().evaluator;
};

export const useDefinitionClusters = (): Clusters => {
  const { definition } = useRelativeValuesData();
  return useMemo(
    () =>
      Object.fromEntries(
        definition.clusters.map((cluster) => [cluster.id, cluster])
      ),
    [definition]
  );
};

export { useRelativeValuesDispatch };
