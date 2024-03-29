import { useCallback, useState } from "react";

import { Env, SqProject } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";

export type SimulatorArgs = {
  code: string;
  sourceId: string;
  project: SqProject;
  continues: string[];
  autorunMode: boolean;
};

export type Simulation = {
  output: SqOutputResult;
  code: string;
  executionId: number;
  executionTime: number;
  isStale?: boolean;
  environment: Env;
};

export type UseSimulator = [
  Simulation | undefined,
  { runSimulation: () => void },
];

export function useSimulator(args: SimulatorArgs): UseSimulator {
  const [simulation, setSimulation] = useState<Simulation | undefined>(
    undefined
  );

  const simulate = useCallback(async () => {
    const act = async () => {
      setSimulation((prevOutput) => {
        return prevOutput
          ? {
              ...(prevOutput || {}),
              isStale: true,
            }
          : undefined;
      });

      // If you want the dice to be rolled in the same frame as the code is set, you can use this. However, it causes a flicker.
      // await new Promise((resolve) => requestAnimationFrame(resolve));
      // await new Promise((resolve) => requestAnimationFrame(resolve));

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
    };

    if (typeof MessageChannel === "undefined") {
      setTimeout(act, 10);
    } else {
      // trick from https://stackoverflow.com/a/56727837
      const channel = new MessageChannel();
      channel.port1.onmessage = act;
      requestAnimationFrame(function () {
        channel.port2.postMessage(undefined);
      });
    }
  }, [args.code, args.continues, args.project, args.sourceId]);

  return [simulation, { runSimulation: simulate }];
}

export function isSimulating(simulation: Simulation): boolean {
  return simulation.isStale ?? false;
}
