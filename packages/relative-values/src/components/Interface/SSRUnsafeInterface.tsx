import { FC } from "react";
import { Catalog } from "../Catalog";
import { StyledTab } from "../ui/StyledTab";
import { useInterfaceContext } from "./InterfaceProvider";
import { ModelSection } from "./ModelSection";
import { Toolbar } from "./Toolbar";

// need to be wrapped in InterfaceProvider
export const SSRUnsafeInterface: FC = () => {
  const { catalog, models } = useInterfaceContext();

  const displayDate = (date?: Date) => {
    return date ? new Date(date).toLocaleDateString() : "";
  };

  return (
    <StyledTab.Group>
      <div className="bg-blue-100 p-8">
        <div className="flex justify-between items-start">
          <div>
            <header className="text-2xl font-bold mb-4">{catalog.title}</header>
            <div className="text-sm text-gray-600 space-y-1">
              {catalog.author && (
                <p className="font-semibold">
                  Author: <span className="font-normal">{catalog.author}</span>
                </p>
              )}
              {catalog.created && (
                <p className="font-semibold">
                  Date of Creation:{" "}
                  <span className="font-normal">
                    {displayDate(catalog.created)}
                  </span>
                </p>
              )}
              <p>
                <span className="font-semibold">{catalog.items.length}</span>{" "}
                items
              </p>
              <p>
                <span className="font-semibold">{models.size}</span> models
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-4">
            <StyledTab.List>
              <StyledTab name="Estimates" icon={() => <div />} />
              <StyledTab name="About" icon={() => <div />} />
            </StyledTab.List>
            <Toolbar />
          </div>
        </div>
      </div>
      <div className="p-4">
        <StyledTab.Panels>
          <StyledTab.Panel>
            <ModelSection />
          </StyledTab.Panel>
          <StyledTab.Panel>
            <Catalog />
          </StyledTab.Panel>
        </StyledTab.Panels>
      </div>
    </StyledTab.Group>
  );
};
