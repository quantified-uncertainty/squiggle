import {
  createContext,
  FC,
  PropsWithChildren,
  Reducer,
  startTransition,
  useContext,
  useReducer,
} from "react";
import { Clusters } from "./types";
import { Set } from "immutable";

export type Filter = {
  selectedClusters: Set<string>;
};

export type Axis = "rows" | "columns";

export type GridMode = "full" | "half";

type ViewContextShape = {
  clusters: Clusters;
  gridMode: GridMode;
  filters: {
    [k in Axis]: Filter;
  };
};

export const ViewContext = createContext<ViewContextShape>({
  clusters: {},
  gridMode: "half",
  filters: {
    rows: {
      selectedClusters: Set(),
    },
    columns: {
      selectedClusters: Set(),
    },
  },
});

export const ViewDispatchContext = createContext<(action: Action) => void>(
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

const reducer: Reducer<ViewContextShape, Action> = (state, action) => {
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

export const useViewContext = () => {
  return useContext(ViewContext);
};

export const useViewDispatch = () => {
  return useContext(ViewDispatchContext);
};

export const ViewProvider: FC<
  PropsWithChildren<{ initialClusters: Clusters }>
> = ({ initialClusters, children }) => {
  // TODO - when clusters change (e.g. when we update the underlying model), we should update the state
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const clusterIds = Set(Object.keys(initialClusters));
    const defaultFilter: Filter = {
      selectedClusters: clusterIds,
    };

    return {
      clusters: initialClusters,
      gridMode: "half",
      filters: {
        rows: defaultFilter,
        columns: defaultFilter,
      },
    } satisfies ViewContextShape;
  });

  const transitionDispatch = (action: Action) => {
    startTransition(() => {
      dispatch(action);
    });
  };

  return (
    <ViewContext.Provider value={state}>
      <ViewDispatchContext.Provider value={transitionDispatch}>
        {children}
      </ViewDispatchContext.Provider>
    </ViewContext.Provider>
  );
};
