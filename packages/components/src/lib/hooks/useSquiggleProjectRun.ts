import { useCallback, useState } from "react";

import { SqProject } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";

export type SquiggleArgs = {
  code: string;
  sourceId: string;
  project: SqProject;
  continues: string[];
  autorunMode: boolean;
};

export type UpcomingSquiggleOutput = {
  code: string;
  executionId: number;
};

export type SquiggleProjectRun = {
  output: SqOutputResult;
  code: string;
  executionId: number;
  executionTime: number;
  isStale?: boolean;
};

export type UseSquiggleProjectRun = [
  SquiggleProjectRun | undefined,
  { rerunSquiggleCode: () => void },
];

export function useSquiggleProjectRun(
  args: SquiggleArgs
): UseSquiggleProjectRun {
  const [squiggleProjectRun, setSquiggleProjectRun] = useState<
    SquiggleProjectRun | undefined
  >(undefined);

  const runSquiggle = useCallback(async () => {
    const act = async () => {
      setSquiggleProjectRun((prevOutput) => {
        return prevOutput
          ? {
              isStale: true,
              ...(prevOutput || {}),
            }
          : undefined;
      });

      const startTime = Date.now();
      args.project.setSource(args.sourceId, args.code);
      args.project.setContinues(args.sourceId, args.continues);
      await args.project.run(args.sourceId);
      const output = args.project.getOutput(args.sourceId);
      const executionTime = Date.now() - startTime;

      setSquiggleProjectRun((previousOutput) => {
        const previousExecutionId = previousOutput?.executionId || 0;
        return {
          executionId: previousExecutionId + 1,
          isStale: false,
          code: args.code,
          output,
          executionTime,
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

  return [squiggleProjectRun, { rerunSquiggleCode: runSquiggle }];
}

export function isRunning(squiggleProjectRun: SquiggleProjectRun): boolean {
  return squiggleProjectRun.isStale ?? false;
}
