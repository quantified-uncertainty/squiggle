import { Box, Text } from "ink";
import { FC } from "react";

import { Env } from "../dists/env.js";
import { ModuleData, ProjectState } from "../public/SqProject/ProjectState.js";
import { SqModule } from "../public/SqProject/SqModule.js";

const ModuleInfo: FC<{
  state: ProjectState;
  module: SqModule;
  environment: Env;
}> = ({ state, module, environment }) => {
  const output = state.getOutput(module, environment);

  return (
    <Box gap={2}>
      <Text>{module.name}</Text>
      <Text>
        {output
          ? "✅"
          : module.getImportModules({ state }).type === "loading"
            ? "⌛ Loading imports"
            : module.getImportOutputs({ state, environment }).type === "loading"
              ? "🔄 Waiting for import outputs"
              : "▶️ Running"}
      </Text>
    </Box>
  );
};

const ModuleDataInfo: FC<{
  state: ProjectState;
  hash: string;
  moduleData: ModuleData;
  environment: Env;
}> = ({ state, hash, moduleData, environment }) => {
  return (
    <Box gap={2}>
      <Text>
        {moduleData.type === "loaded"
          ? "✅"
          : moduleData.type === "loading"
            ? "⌛"
            : "❌"}
      </Text>
      {moduleData.type === "loaded" ? (
        <ModuleInfo
          module={moduleData.value}
          state={state}
          environment={environment}
        />
      ) : (
        <Text>{hash}</Text>
      )}
    </Box>
  );
};

export const StateGraph: FC<{ state: ProjectState; environment: Env }> = ({
  state,
  environment,
}) => {
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        State
      </Text>
      {[...state.modules.entries()].map(([hash, moduleData]) => (
        <ModuleDataInfo
          key={hash}
          hash={hash}
          state={state}
          moduleData={moduleData}
          environment={environment}
        />
      ))}
    </Box>
  );
};
