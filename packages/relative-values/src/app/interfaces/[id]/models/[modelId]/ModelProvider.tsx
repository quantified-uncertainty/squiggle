import { useSelectedInterface } from "@/components/Interface/InterfaceProvider";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";

type ModelContextShape = {
  selectedId?: string;
};

const ModelContext = createContext<ModelContextShape>({});

const useModelContext = () => useContext(ModelContext);

export const useSelectedModel = () => {
  const { selectedId } = useModelContext();
  const { models } = useSelectedInterface();

  const selectedModel = useMemo(() => {
    if (selectedId === undefined) {
      return;
    }
    return models.get(selectedId);
  }, [models, selectedId]);

  return selectedModel;
};

export const ModelProvider: FC<
  PropsWithChildren<{ value: ModelContextShape }>
> = ({ value, children }) => {
  return (
    <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
  );
};
