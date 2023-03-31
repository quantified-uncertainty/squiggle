import { FC, useMemo } from "react";

import { useSelectedModel } from "@/app/interfaces/[id]/models/[modelId]/ModelProvider";
import { ChipIcon } from "@/components/ui/icons/ChipIcon";
import {
  useInterfaceById,
  useStorageDispatch,
} from "@/storage/StorageProvider";
import { ModelEvaluator } from "@/values/ModelEvaluator";
import { ModelEditor } from "../ModelEditor";
import { StyledTab } from "../ui/StyledTab";
import { GridView } from "../View/GridView";
import { ListView } from "../View/ListView";
import { PlotView } from "../View/PlotView";
import { ViewProvider } from "../View/ViewProvider";
import { useInterfaceContext } from "./InterfaceProvider";
import { ModelPicker } from "./ModelPicker";

const NotFound: FC<{ error: string }> = ({ error }) => (
  <div className="text-red-500 p-4">{error}</div>
);

export const ModelSection: FC = () => {
  const model = useSelectedModel();
  const { interfaceId } = useInterfaceContext();
  const interfaceWithModels = useInterfaceById(interfaceId);

  const dispatch = useStorageDispatch();

  const modelEvaluatorResult = useMemo(
    () => (model ? ModelEvaluator.create(model) : undefined),
    [model]
  );

  if (!interfaceWithModels || !model || !modelEvaluatorResult) {
    return <NotFound error="Model not found" />;
  }

  return (
    <ViewProvider initialClusters={interfaceWithModels.catalog.clusters}>
      <StyledTab.Group>
        <div className="mb-8 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex">
            <div>
              {model ? (
                <div className="px-3 py-1 bg-emerald-50 text-emerald-900 rounded-sm hover:bg-emerald-300 text-lg font-semibold flex">
                  <span className="pt-1 pr-2">
                    <ChipIcon className="fill-emerald-600" />
                  </span>
                  <span>{model.title}</span>
                </div>
              ) : (
                ""
              )}
            </div>
            <div>
              <ModelPicker />
              {modelEvaluatorResult.ok ? null : (
                <pre className="text-red-700">{modelEvaluatorResult.value}</pre>
              )}
            </div>
          </div>
          <StyledTab.List>
            <StyledTab name="List" />
            <StyledTab name="Grid" />
            <StyledTab name="Plot" />
            <StyledTab name="Editor" />
          </StyledTab.List>
        </div>
        <StyledTab.Panels>
          <StyledTab.Panel>
            {modelEvaluatorResult.ok ? (
              <ListView model={modelEvaluatorResult.value} />
            ) : null}
          </StyledTab.Panel>
          <StyledTab.Panel>
            {modelEvaluatorResult.ok ? (
              <GridView model={modelEvaluatorResult.value} />
            ) : null}
          </StyledTab.Panel>
          <StyledTab.Panel>
            {modelEvaluatorResult.ok ? (
              <PlotView model={modelEvaluatorResult.value} />
            ) : null}
          </StyledTab.Panel>
          <StyledTab.Panel>
            {model ? (
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
            ) : null}
          </StyledTab.Panel>
        </StyledTab.Panels>
      </StyledTab.Group>
    </ViewProvider>
  );
};
