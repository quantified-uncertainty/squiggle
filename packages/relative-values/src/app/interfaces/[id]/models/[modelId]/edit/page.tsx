"use client";

import { useInterfaceContext } from "@/components/Interface/InterfaceProvider";
import { ModelEditor } from "@/components/ModelEditor";
import { useStorageDispatch } from "@/storage/StorageProvider";
import { useSelectedModel } from "../ModelProvider";

export default function PlotViewPage() {
  const model = useSelectedModel();
  const { interfaceId } = useInterfaceContext();
  const dispatch = useStorageDispatch();

  return model ? (
    <ModelEditor
      model={model}
      setModel={(newModel) =>
        dispatch({
          type: "updateModel",
          payload: {
            interfaceId,
            model: {
              ...newModel,
              modified: true, // skip cache
            },
          },
        })
      }
    />
  ) : null;
}
