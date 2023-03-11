import { SquiggleContainer } from "@quri/squiggle-components";
import { FC } from "react";
import { ViewProvider } from "./ViewProvider";
import { useRelativeValues } from "./hooks";
import { NxNView } from "./NxNView";

type Props = {
  code: string;
};

export const View: FC<Props> = ({ code }) => {
  // TODO - store most of these in context? they're all global
  const { error, choices, clusters, fn, project } = useRelativeValues(code);

  return (
    <ViewProvider initialClusters={clusters}>
      <SquiggleContainer>
        <div>
          {error && <pre className="text-red-700">{error}</pre>}
          {fn ? <NxNView fn={fn} project={project} choices={choices} /> : null}
        </div>
      </SquiggleContainer>
    </ViewProvider>
  );
};
