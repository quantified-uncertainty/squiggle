import { Model } from "@/model/utils";
import { Catalog } from "@/types";
import {
  createContext,
  FC,
  PropsWithChildren,
  startTransition,
  useContext,
  useReducer,
} from "react";

type DashboardContextShape = {
  model: Model;
  catalog: Catalog;
};

const DashboardContext = createContext<DashboardContextShape>({
  model: {
    mode: "text",
    code: "",
  },
  catalog: {
    title: "Undefined",
    items: [],
    clusters: {},
  },
});

type Action = {
  type: "setModel";
  payload: Model;
};

const reducer = (
  state: DashboardContextShape,
  action: Action
): DashboardContextShape => {
  switch (action.type) {
    case "setModel":
      return {
        ...state,
        model: action.payload,
      };
    default:
      return state;
  }
};

const DashboardDispatchContext = createContext<(action: Action) => void>(
  () => {}
);

export const useDashboardContext = () => {
  return useContext(DashboardContext);
};

export const useDashboardDispatch = () => {
  return useContext(DashboardDispatchContext);
};

export const DashboardProvider: FC<
  PropsWithChildren<{ getInitialValue(): DashboardContextShape }>
> = ({ children, getInitialValue }) => {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialValue);

  const transitionDispatch = (action: Action) => {
    startTransition(() => {
      dispatch(action);
    });
  };

  return (
    <DashboardContext.Provider value={state}>
      <DashboardDispatchContext.Provider value={transitionDispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardContext.Provider>
  );
};
