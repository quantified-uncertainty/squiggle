import { generateProvider } from "@/components/generateProvider";
import { InterfaceWithModels } from "@/types";
import { FC, PropsWithChildren, Reducer } from "react";
import { allInterfaces } from "@models/src";
import { createEmptyGraphModel, Model } from "@/model/utils";

type Storage = {
  allInterfaces: InterfaceWithModels[];
};

const defaultValue: Storage = { allInterfaces };

type Action =
  | {
      type: "createInterface";
      payload: InterfaceWithModels;
    }
  | {
      type: "createModel";
      payload: {
        interfaceId: string;
        model: {
          id: string;
          author: string;
          title: string;
        };
      };
    }
  | {
      type: "updateModel";
      payload: {
        interfaceId: string;
        model: Model;
      };
    };

const reducer: Reducer<Storage, Action> = (state, action) => {
  switch (action.type) {
    case "createModel":
      return {
        ...state,
        allInterfaces: allInterfaces.map((int) =>
          int.catalog.id === action.payload.interfaceId
            ? {
                ...int,
                models: int.models.set(
                  action.payload.model.id,
                  createEmptyGraphModel({
                    id: action.payload.model.id,
                    author: action.payload.model.author,
                    title: action.payload.model.title,
                    catalog: int.catalog,
                  })
                ),
              }
            : int
        ),
      };
    case "updateModel":
      return {
        ...state,
        allInterfaces: allInterfaces.map((int) =>
          int.catalog.id === action.payload.interfaceId
            ? {
                ...int,
                models: int.models.set(
                  action.payload.model.id,
                  action.payload.model
                ),
              }
            : int
        ),
      };
    case "createInterface":
      return {
        ...state,
        allInterfaces: allInterfaces.map((int) =>
          int.catalog.id === action.payload.catalog.id ? action.payload : int
        ),
      };
    default:
      return state;
  }
};

const {
  Provider,
  useContext: useStorageContext,
  useDispatch: useStorageDispatch,
} = generateProvider({
  name: "Storage",
  reducer,
  defaultValue,
});

export const StorageProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Provider generateInitialValue={() => defaultValue}>{children}</Provider>
  );
};

export function useInterfaceById(id: string) {
  const { allInterfaces } = useStorageContext();

  return allInterfaces.find((i) => i.catalog.id === id);
}

export function useAllInterfaces() {
  const { allInterfaces } = useStorageContext();
  return allInterfaces;
}

export { useStorageDispatch };
