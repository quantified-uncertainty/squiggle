import { FC } from "react";
import { ModelEditor } from "../ModelEditor";
import { StyledTab } from "../ui/StyledTab";
import { GridView } from "../View/GridView";
import { useRelativeValues } from "../View/hooks";
import { ListView } from "../View/ListView";
import { PlotView } from "../View/PlotView";
import { ViewProvider } from "../View/ViewProvider";
import {
  useInterfaceContext,
  useInterfaceDispatch,
  useSelectedModel,
} from "./InterfaceProvider";
import { ModelPicker } from "./ModelPicker";
import { NewModelForm } from "./NewModelForm";

export const ModelSection: FC = () => {
  const model = useSelectedModel();
  const { error, rv } = useRelativeValues(model);
  const {
    catalog: { clusters },
    currentModel,
  } = useInterfaceContext();
  const dispatch = useInterfaceDispatch();

  switch (currentModel.mode) {
    case "unselected":
      return (
        <div className="flex">
          <ModelPicker />
        </div>
      );
    case "new":
      return (
        <div className="flex flex-col gap-4 items-start">
          <ModelPicker />
          <div className="self-stretch">
            <NewModelForm />
          </div>
        </div>
      );
    default:
      return (
        <ViewProvider initialClusters={clusters}>
          <StyledTab.Group>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <ModelPicker />
                {error && <pre className="text-red-700">{error}</pre>}
              </div>
              <StyledTab.List>
                <StyledTab name="List" icon={() => <div />} />
                <StyledTab name="Grid" icon={() => <div />} />
                <StyledTab name="Plot" icon={() => <div />} />
                <StyledTab name="Editor" icon={() => <div />} />
              </StyledTab.List>
            </div>
            <StyledTab.Panels>
              <StyledTab.Panel>
                {rv ? <ListView rv={rv} /> : null}
              </StyledTab.Panel>
              <StyledTab.Panel>
                {rv ? <GridView rv={rv} /> : null}
              </StyledTab.Panel>
              <StyledTab.Panel>
                {rv ? <PlotView rv={rv} /> : null}
              </StyledTab.Panel>
              <StyledTab.Panel>
                {model ? (
                  <ModelEditor
                    model={model}
                    setModel={(newModel) =>
                      dispatch({ type: "updateModel", payload: newModel })
                    }
                  />
                ) : null}
              </StyledTab.Panel>
            </StyledTab.Panels>
          </StyledTab.Group>
        </ViewProvider>
      );
  }
};
