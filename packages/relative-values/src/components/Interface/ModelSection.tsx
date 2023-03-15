import { getModelCode, Model } from "@/model/utils";
import { FC, useMemo } from "react";
import { Estimate } from "../Estimate";
import { StyledTab } from "../ui/StyledTab";
import { GridView } from "../View/GridView";
import { useRelativeValues } from "../View/hooks";
import { ListView } from "../View/ListView";
import { ViewProvider } from "../View/ViewProvider";
import { useInterfaceContext, useInterfaceDispatch } from "./InterfaceProvider";

const InnerModelSection: FC<{ model: Model }> = ({ model }) => {
  const code = getModelCode(model);
  const { error, fn } = useRelativeValues(code);
  const {
    catalog: { clusters },
  } = useInterfaceContext();
  const dispatch = useInterfaceDispatch();

  return (
    <ViewProvider initialClusters={clusters}>
      <header className="font-bold mb-4">Model by {model.author}</header>
      {error && <pre className="text-red-700">{error}</pre>}
      <StyledTab.Group>
        <div className="mb-4 flex items-center justify-between">
          <StyledTab.List>
            <StyledTab name="List" icon={() => <div />} />
            <StyledTab name="Grid" icon={() => <div />} />
            <StyledTab name="Editor" icon={() => <div />} />
          </StyledTab.List>
        </div>
        <StyledTab.Panels>
          <StyledTab.Panel>{fn ? <ListView fn={fn} /> : null}</StyledTab.Panel>
          <StyledTab.Panel>{fn ? <GridView fn={fn} /> : null}</StyledTab.Panel>
          <StyledTab.Panel>
            <Estimate
              model={model}
              setModel={(newModel) =>
                dispatch({ type: "updateModel", payload: newModel })
              }
            />
          </StyledTab.Panel>
        </StyledTab.Panels>
      </StyledTab.Group>
    </ViewProvider>
  );
};

export const ModelSection: FC = () => {
  const { selectedModelId, models } = useInterfaceContext();

  // TODO - use selectedModelId
  const model = useMemo(() => {
    if (selectedModelId === undefined) {
      return;
    }
    return models.get(selectedModelId);
  }, [models, selectedModelId]);

  if (!model) {
    return <div>No model</div>;
  }

  return <InnerModelSection model={model} />;
};
