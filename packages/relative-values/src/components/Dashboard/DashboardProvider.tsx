import { createContext, FC, PropsWithChildren, useReducer } from "react";
import { Clusters } from "./types";
import { Set } from "immutable";

type DashboardContextShape = {
  clusters: Clusters;
  selectedClusters: Set<string>;
};

export const DashboardContext = createContext<DashboardContextShape>({
  clusters: {},
  selectedClusters: Set<string>(),
});

export const DashboardDispatchContext = createContext<(action: Action) => void>(
  () => {}
);

type Action = {
  type: "toggleCluster";
  payload: string;
};

const reducer = (state: DashboardContextShape, action: Action) => {
  switch (action.type) {
    case "toggleCluster":
      return {
        ...state,
        selectedClusters: state.selectedClusters.has(action.payload)
          ? state.selectedClusters.delete(action.payload)
          : state.selectedClusters.add(action.payload),
      };
    default:
      return state;
  }
};

export const DashboardProvider: FC<
  PropsWithChildren<{ initialClusters: Clusters }>
> = ({ initialClusters, children }) => {
  // TODO - when clusters change (e.g. when we update the underlying model), we should update the state
  const [state, dispatch] = useReducer(reducer, null, () => ({
    clusters: initialClusters,
    selectedClusters: Set(Object.keys(initialClusters)),
  }));

  return (
    <DashboardContext.Provider value={state}>
      <DashboardDispatchContext.Provider value={dispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardContext.Provider>
  );
};
