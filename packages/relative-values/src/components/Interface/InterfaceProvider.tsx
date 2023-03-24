import { useInterfaceById } from "@/storage/StorageProvider";
import { createContext, FC, PropsWithChildren, useContext } from "react";

export type InterfaceContextShape = {
  interfaceId: string;
};

const InterfaceContext = createContext<InterfaceContextShape>({
  interfaceId: "default",
});

export const InterfaceProvider: FC<
  PropsWithChildren<{ value: InterfaceContextShape }>
> = ({ value, children }) => {
  return (
    <InterfaceContext.Provider value={value}>
      {children}
    </InterfaceContext.Provider>
  );
};

export const useInterfaceContext = () => useContext(InterfaceContext);

export const useSelectedInterface = () => {
  const { interfaceId } = useInterfaceContext();
  const interfaceWithModel = useInterfaceById(interfaceId);
  if (!interfaceWithModel) {
    // should be checked when InterfaceProvider is created, so we don't have to deal with undefined types
    throw new Error(`Interface ${interfaceId} not found`);
  }
  return interfaceWithModel;
};
