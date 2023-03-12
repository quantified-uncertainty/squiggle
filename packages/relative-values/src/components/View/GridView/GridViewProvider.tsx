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

type GridViewContextShape = {
  gridMode: GridMode;
  filters: {
    [k in Axis]: Filter;
  };
};

export const GridViewContext = createContext<GridViewContextShape>({
  gridMode: "full",
  filters: {
    rows: {
      selectedClusters: Set(),
    },
    columns: {
      selectedClusters: Set(),
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
      type: "setGridMode";
      payload: GridMode;
    };

const toggle = (set: Set<string>, id: string) =>
  set.has(id) ? set.delete(id) : set.add(id);

const reducer: Reducer<GridViewContextShape, Action> = (state, action) => {
  switch (action.type) {
    case "toggleCluster": {
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.axis]: {
            ...state.filters[action.payload.axis],
            selectedClusters: toggle(
              state.filters[action.payload.axis].selectedClusters,
              action.payload.id
            ),
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
    const defaultFilter: Filter = {
      selectedClusters: clusterIds,
    };

    return {
      gridMode: "full",
      filters: {
        rows: defaultFilter,
        columns: defaultFilter,
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
