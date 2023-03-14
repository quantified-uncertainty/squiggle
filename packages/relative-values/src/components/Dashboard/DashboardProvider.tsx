import { Model } from "@/model/utils";
import { Catalog } from "@/types";
import {
  createContext,
  FC,
  PropsWithChildren,
  Reducer,
  startTransition,
  useContext,
  useReducer,
} from "react";
import { generateProvider } from "../generateProvider";

export type DashboardContextShape = {
  model: Model;
  catalog: Catalog;
};

const defaultValue: DashboardContextShape = {
  model: {
    mode: "text",
    code: "",
  },
  catalog: {
    title: "Undefined",
    items: [],
    clusters: {},
  },
};

type Action =
  | {
      type: "setModel";
      payload: Model;
    }
  | {
      type: "load";
      payload: DashboardContextShape;
    };

const reducer: Reducer<DashboardContextShape, Action> = (state, action) => {
  switch (action.type) {
    case "setModel":
      return {
        ...state,
        model: action.payload,
      };
    case "load":
      return action.payload;
    default:
      return state;
  }
};

export const {
  Provider: DashboardProvider,
  useContext: useDashboardContext,
  useDispatch: useDashboardDispatch,
} = generateProvider({
  name: "Dashboard",
  reducer,
  defaultValue,
});
