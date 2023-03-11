import { SquiggleContainer } from "@quri/squiggle-components";
import { FC } from "react";
import { DashboardProvider } from "./DashboardProvider";
import { useRelativeValues } from "./hooks";
import { RelativeValuesTable } from "./RelativeValuesTable";

type Props = {
  code: string;
};

export const Dashboard: FC<Props> = ({ code }) => {
  // TODO - store most of these in context? they're all global
  const { error, choices, clusters, fn, project } = useRelativeValues(code);

  return (
    <DashboardProvider initialClusters={clusters}>
      <SquiggleContainer>
        <div>
          {error && <pre className="text-red-700">{error}</pre>}
          {fn ? (
            <RelativeValuesTable fn={fn} project={project} choices={choices} />
          ) : null}
        </div>
      </SquiggleContainer>
    </DashboardProvider>
  );
};
