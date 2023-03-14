import { FC } from "react";
import { useDashboardContext } from "../Dashboard/DashboardProvider";
import { StyledTab } from "../ui/StyledTab";
import { GridView } from "./GridView";
import { useRelativeValues } from "./hooks";
import { ListView } from "./ListView";
import { ViewProvider } from "./ViewProvider";

type Props = {
  code: string;
};

export const View: FC<Props> = ({ code }) => {
  // TODO - store most of these in context? they're all global
  const { error, fn } = useRelativeValues(code);
  const {
    catalog: { clusters },
  } = useDashboardContext();

  return (
    <ViewProvider initialClusters={clusters}>
      {error && <pre className="text-red-700">{error}</pre>}
      <StyledTab.Group>
        <div className="mb-4">
          <StyledTab.List>
            <StyledTab name="List" icon={() => <div />} />
            <StyledTab name="Grid" icon={() => <div />} />
          </StyledTab.List>
        </div>
        <StyledTab.Panels>
          <StyledTab.Panel>{fn ? <ListView fn={fn} /> : null}</StyledTab.Panel>
          <StyledTab.Panel>{fn ? <GridView fn={fn} /> : null}</StyledTab.Panel>
        </StyledTab.Panels>
      </StyledTab.Group>
    </ViewProvider>
  );
};
