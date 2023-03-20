import { createEmptyGraphModel, Model } from "@/model/utils";
import { InterfaceWithModels } from "@/types";
import { FC, PropsWithChildren, Reducer, useMemo } from "react";
import { generateProvider } from "../generateProvider";
import { Map } from "immutable";

export type InterfaceContextShape = InterfaceWithModels;

const defaultValue: InterfaceContextShape = {
  models: Map([
    [
      "default",
      {
        mode: "text",
        code: "",
        author: "unknown",
      },
    ],
  ]),
  catalog: {
    id: "undefined",
    title: "Undefined",
    items: [],
    clusters: {},
  },
};

type Action =
  | {
      type: "selectModel";
      payload: string;
    }
  | {
      type: "createModel";
      payload: {
        id: string;
        author: string;
      };
    }
  | {
      type: "updateModel";
      payload: {
        id: string;
        model: Model;
      };
    }
  | {
      type: "load";
      payload: InterfaceContextShape;
    };

const reducer: Reducer<InterfaceContextShape, Action> = (state, action) => {
  switch (action.type) {
    case "createModel":
      return {
        ...state,
        models: state.models.set(
          action.payload.id,
          createEmptyGraphModel({
            author: action.payload.author,
            catalog: state.catalog,
          })
        ),
      };
    case "updateModel":
      return {
        ...state,
        models: state.models.set(action.payload.id, action.payload.model),
      };
    case "load":
      return action.payload;
    default:
      return state;
  }
};

const { useContext, useDispatch, Provider } = generateProvider({
  name: "Interface",
  reducer,
  defaultValue,
});

export const useInterfaceContext = useContext;
export const useInterfaceDispatch = useDispatch;

export const InterfaceProvider: FC<
  PropsWithChildren<{ initialValue: InterfaceContextShape }>
> = ({ initialValue, children }) => {
  return (
    <Provider generateInitialValue={() => initialValue}>{children}</Provider>
  );
};
