import { createEmptyGraphModel, Model } from "@/model/utils";
import { InterfaceWithModels } from "@/types";
import { FC, PropsWithChildren, Reducer, useMemo } from "react";
import { generateProvider } from "../generateProvider";
import { Map } from "immutable";

export type InterfaceContextShape = InterfaceWithModels & {
  currentModel:
    | {
        mode: "selected";
        id: string;
      }
    | {
        mode: "unselected";
      }
    | {
        mode: "new";
      };
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
  currentModel: {
    mode: "unselected",
  },
};

type Action =
  | {
      type: "selectModel";
      payload: string;
    }
  | {
      type: "openNewModelForm";
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
        currentModel: { mode: "selected", id: action.payload },
      };
    case "openNewModelForm":
      return {
        ...state,
        currentModel: { mode: "new" },
      };
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
        currentModel: { mode: "selected", id: action.payload.id },
      };
    case "updateModel":
      return {
        ...state,
        models: state.models.mapEntries(([k, v]) => {
          if (
            state.currentModel.mode === "selected" &&
            k === state.currentModel.id
          ) {
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

export const useSelectedModel = () => {
  const { currentModel, models } = useInterfaceContext();
  const model = useMemo(() => {
    if (currentModel.mode !== "selected") {
      return;
    }
    return models.get(currentModel.id);
  }, [models, currentModel]);

  return model;
};

export const InterfaceProvider: FC<
  PropsWithChildren<{ initialValue: InterfaceContextShape }>
> = ({ initialValue, children }) => {
  return (
    <Provider generateInitialValue={() => initialValue}>{children}</Provider>
  );
};
