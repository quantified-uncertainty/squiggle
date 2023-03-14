import {
  createContext,
  FC,
  PropsWithChildren,
  Reducer,
  startTransition,
  useContext,
  useReducer,
} from "react";
import { Clusters } from "@/types";
import { Set } from "immutable";
import { Filter } from "../types";

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

type GridViewContextShape = {
  gridMode: GridMode;
  axisConfig: { [k in Axis]: AxisConfig };
};

export const GridViewContext = createContext<GridViewContextShape>({
  gridMode: "full",
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
});

export const GridViewDispatchContext = createContext<(action: Action) => void>(
  () => {}
);

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

const reducer: Reducer<GridViewContextShape, Action> = (state, action) => {
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

export const useGridViewContext = () => {
  return useContext(GridViewContext);
};

export const useGridViewDispatch = () => {
  return useContext(GridViewDispatchContext);
};

export const GridViewProvider: FC<
  PropsWithChildren<{ initialClusters: Clusters }>
> = ({ initialClusters, children }) => {
  // TODO - when clusters change (e.g. when we update the underlying model), we should update the state
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const clusterIds = Set(Object.keys(initialClusters));
    const defaultAxisConfig = {
      filter: { selectedClusters: clusterIds },
      sort: { mode: "default", desc: false },
    } satisfies AxisConfig;

    return {
      gridMode: "full",
      axisConfig: {
        rows: defaultAxisConfig,
        columns: defaultAxisConfig,
      },
    } satisfies GridViewContextShape;
  });

  const transitionDispatch = (action: Action) => {
    startTransition(() => {
      dispatch(action);
    });
  };

  return (
    <GridViewContext.Provider value={state}>
      <GridViewDispatchContext.Provider value={transitionDispatch}>
        {children}
      </GridViewDispatchContext.Provider>
    </GridViewContext.Provider>
  );
};
