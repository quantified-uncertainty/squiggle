import { Model } from "@/model/utils";
import { InterfaceWithModels } from "@/types";
import { FC, PropsWithChildren, Reducer } from "react";
import { generateProvider } from "../generateProvider";
import { Map } from "immutable";

export type InterfaceContextShape = InterfaceWithModels & {
  selectedModelId?: string;
};

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
      type: "updateModel";
      payload: Model;
    }
  | {
      type: "load";
      payload: InterfaceContextShape;
    };

const reducer: Reducer<InterfaceContextShape, Action> = (state, action) => {
  switch (action.type) {
    case "selectModel":
      return {
        ...state,
        selectedModelId: action.payload,
      };
    case "updateModel":
      return {
        ...state,
        models: state.models.mapEntries(([k, v]) => {
          if (k === state.selectedModelId) {
            return [k, action.payload];
          } else {
            return [k, v];
          }
        }),
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
  PropsWithChildren<{ initialValue: InterfaceWithModels }>
> = ({ initialValue, children }) => {
  return (
    <Provider
      generateInitialValue={() => {
        return {
          ...initialValue,
          selectedModelId: [...initialValue.models.keys()][0],
        };
      }}
    >
      {children}
    </Provider>
  );
};
