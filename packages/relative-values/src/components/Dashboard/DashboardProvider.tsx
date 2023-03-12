import { getQuriCatalog } from "@/catalog/builtin";
import { getQuriGraphModel, getQuriTextModel } from "@/model/builtin";
import { Model } from "@/model/utils";
import { Catalog, Choice } from "@/types";
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

const buildDefaultContext = () => {
  // const model = getQuriTextModel();
  const model = getQuriGraphModel();
  const catalog = getQuriCatalog();

  return {
    model,
    catalog,
  };
};

const defaultContext = buildDefaultContext();

const DashboardContext = createContext<DashboardContextShape>(defaultContext);

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

export const DashboardProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, defaultContext);

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
