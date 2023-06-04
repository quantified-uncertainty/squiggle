import { Set } from "immutable";
import { FC, PropsWithChildren, Reducer } from "react";

import { RelativeValuesDefinitionRevision$data } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { generateProvider } from "@/relative-values/components/generateProvider";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { Filter } from "./types";

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
  evaluator: ModelEvaluator;
  definition: RelativeValuesDefinitionRevision$data;
  gridMode: GridMode;
  axisConfig: { [k in Axis]: AxisConfig };
};

const defaultValue: ViewContextShape = {
  gridMode: "full",
  evaluator: undefined as any, // FIXME, evil hack
  definition: {} as any, // FIXME, evil hack
  axisConfig: {
    rows: {
      filter: {
        selectedClusters: Set(),
      },
      sort: {
        mode: "default",
        desc: false,
      },
    },
    columns: {
      filter: {
        selectedClusters: Set(),
      },
      sort: {
        mode: "default",
        desc: false,
      },
    },
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
  useContext: useRelativeValuesContext,
  useDispatch: useRelativeValuesDispatch,
} = generateProvider({
  name: "View",
  reducer,
  defaultValue,
});

export const RelativeValuesProvider: FC<
  PropsWithChildren<{
    definition: RelativeValuesDefinitionRevision$data;
    evaluator: ModelEvaluator;
  }>
> = ({ evaluator, definition, children }) => {
  return (
    <Provider
      generateInitialValue={() => {
        const clusterIds = Set<string>(
          definition.clusters.map((cluster) => cluster.id)
        );
        const defaultAxisConfig: AxisConfig = {
          filter: { selectedClusters: clusterIds },
          sort: { mode: "default", desc: false },
        };

        return {
          evaluator,
          definition,
          gridMode: "full",
          axisConfig: {
            rows: defaultAxisConfig,
            columns: defaultAxisConfig,
          },
        };
      }}
    >
      {children}
    </Provider>
  );
};

export const useDefinition = () => {
  const { definition } = useRelativeValuesContext();
  return definition;
};

export const useDefinitionClusters = () => {
  const {
    definition: { clusters },
  } = useRelativeValuesContext();
  return Object.fromEntries(clusters.map((cluster) => [cluster.id, cluster]));
};

export { useRelativeValuesContext, useRelativeValuesDispatch };
