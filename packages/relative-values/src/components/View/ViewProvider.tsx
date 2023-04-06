import { generateProvider } from "@/components/generateProvider";
import { Clusters } from "@/types";
import { Set } from "immutable";
import { FC, PropsWithChildren, Reducer } from "react";
import { Filter } from "./types";
import { ModelEvaluator } from "@/values/ModelEvaluator";

export type Axis = "rows" | "columns";

export type GridMode = "full" | "half";

export type SortMode = "default" | "median" | "uncertainty";

export type SortConfig = {
  mode: SortMode;
  desc: boolean;
};

export type AxisConfig = {
  filter: Filter;
  sort: SortConfig;
};

type ViewContextShape = {
  evaluator: ReturnType<(typeof ModelEvaluator)["create"]>;
  gridMode: GridMode;
  axisConfig: { [k in Axis]: AxisConfig };
};

const defaultValue: ViewContextShape = {
  gridMode: "full",
  evaluator: { ok: false, value: "uninitialized" },
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
  useContext: useViewContext,
  useDispatch: useViewDispatch,
} = generateProvider({
  name: "View",
  reducer,
  defaultValue,
});

export const ViewProvider: FC<
  PropsWithChildren<{
    initialClusters: Clusters;
    evaluator: ReturnType<(typeof ModelEvaluator)["create"]>;
  }>
> = ({ initialClusters, evaluator, children }) => {
  return (
    <Provider
      generateInitialValue={() => {
        const clusterIds = Set(Object.keys(initialClusters));
        const defaultAxisConfig: AxisConfig = {
          filter: { selectedClusters: clusterIds },
          sort: { mode: "default", desc: false },
        };

        return {
          evaluator,
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

export { useViewContext, useViewDispatch };
