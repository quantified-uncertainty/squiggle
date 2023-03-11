import {
  createContext,
  FC,
  PropsWithChildren,
  startTransition,
  useReducer,
} from "react";
import { Clusters } from "./types";
import { Set } from "immutable";

export type Filter = {
  selectedClusters: Set<string>;
};

type Axis = "rows" | "columns";

type DashboardContextShape = {
  clusters: Clusters;
  filters: {
    [k in Axis]: Filter;
  };
};

export const DashboardContext = createContext<DashboardContextShape>({
  clusters: {},
  filters: {
    rows: {
      selectedClusters: Set(),
    },
    columns: {
      selectedClusters: Set(),
    },
  },
});

export const DashboardDispatchContext = createContext<(action: Action) => void>(
  () => {}
);

type Action = {
  type: "toggleCluster";
  payload: {
    axis: "rows" | "columns";
    id: string;
  };
};

const toggle = (set: Set<string>, id: string) =>
  set.has(id) ? set.delete(id) : set.add(id);

const reducer = (state: DashboardContextShape, action: Action) => {
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
    default:
      return state;
  }
};

export const DashboardProvider: FC<
  PropsWithChildren<{ initialClusters: Clusters }>
> = ({ initialClusters, children }) => {
  // TODO - when clusters change (e.g. when we update the underlying model), we should update the state
  const [state, dispatch] = useReducer(reducer, null, () => {
    const clusterIds = Set(Object.keys(initialClusters));
    const defaultFilter: Filter = {
      selectedClusters: clusterIds,
    };

    return {
      clusters: initialClusters,
      filters: {
        rows: defaultFilter,
        columns: defaultFilter,
      },
    };
  });

  const transitionDispatch = (action: Action) => {
    startTransition(() => {
      dispatch(action);
    });
  };

  return (
    <DashboardContext.Provider value={state}>
      <DashboardDispatchContext.Provider value={dispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardContext.Provider>
  );
};
