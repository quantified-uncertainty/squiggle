import { useCallback, useState } from "react";

import { Env, SqProject } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";

export type SimulatorArgs = {
  code: string;
  sourceId: string;
  project: SqProject;
  continues: string[];
};

export type Simulation = {
  output: SqOutputResult;
  code: string;
  executionId: number;
  executionTime: number;
  isStale?: boolean;
  environment: Env;
};

type UseSimulatorResult = [
  Simulation | undefined,
  { runSimulation: () => void },
];

export function useSimulator(args: SimulatorArgs): UseSimulatorResult {
  const [simulation, setSimulation] = useState<Simulation | undefined>();

  const simulate = useCallback(async () => {
    setSimulation((prevOutput) => {
      return prevOutput
        ? {
            ...(prevOutput || {}),
            isStale: true,
          }
        : undefined;
    });

    const startTime = Date.now();
    args.project.setSource(args.sourceId, args.code);
    args.project.setContinues(args.sourceId, args.continues);
    const _environment = args.project.getEnvironment(); // Get it here, just in case it changes during the run
    await args.project.run(args.sourceId);
    const output = args.project.getOutput(args.sourceId);
    const executionTime = Date.now() - startTime;

    setSimulation((previousOutput) => {
      const previousExecutionId = previousOutput?.executionId || 0;
      return {
        executionId: previousExecutionId + 1,
        isStale: false,
        code: args.code,
        output,
        executionTime,
        environment: _environment,
      };
    });
  }, [args.code, args.continues, args.project, args.sourceId]);

  return [simulation, { runSimulation: simulate }];
}

export function isSimulating(simulation: Simulation): boolean {
  return simulation.isStale ?? false;
}
