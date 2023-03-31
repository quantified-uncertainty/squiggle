import { useSelectedModel } from "@/app/interfaces/[id]/models/[modelId]/ModelProvider";
import { ChipIcon } from "@/components/ui/icons/ChipIcon";
import {
  useInterfaceById,
  useStorageDispatch,
} from "@/storage/StorageProvider";
import { FC } from "react";
import { ModelEditor } from "../ModelEditor";
import { StyledTab } from "../ui/StyledTab";
import { GridView } from "../View/GridView";
import { useRelativeValues } from "../View/hooks";
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
  const { error, rv } = useRelativeValues(model);
  const { interfaceId } = useInterfaceContext();
  const interfaceWithModels = useInterfaceById(interfaceId);

  const dispatch = useStorageDispatch();

  if (!interfaceWithModels || !model) {
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
              {error && <pre className="text-red-700">{error}</pre>}
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
          <StyledTab.Panel>{rv ? <ListView rv={rv} /> : null}</StyledTab.Panel>
          <StyledTab.Panel>{rv ? <GridView rv={rv} /> : null}</StyledTab.Panel>
          <StyledTab.Panel>{rv ? <PlotView rv={rv} /> : null}</StyledTab.Panel>
          <StyledTab.Panel>
            {model ? (
              <ModelEditor
                model={model}
                setModel={(newModel) =>
                  dispatch({
                    type: "updateModel",
                    payload: {
                      interfaceId,
                      model: newModel,
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
