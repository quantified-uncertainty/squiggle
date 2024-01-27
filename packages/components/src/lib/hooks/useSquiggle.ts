import { useCallback, useEffect, useState } from "react";

import { SqProject } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";

export type SquiggleArgs = {
  code: string;
  sourceId: string;
  executionId?: number;
  project: SqProject;
  continues: string[];
  autorunMode: boolean;
};

export type UpcomingSquiggleOutput = {
  code: string;
  executionId: number;
};

// TODO - think of a better name, `SquiggleOutput` is too similar to `SqOutput`
export type SquiggleOutput = {
  output: SqOutputResult;
  code: string;
  executionId: number;
  executionTime: number;
  isStale?: boolean;
};

export type UseSquiggleOutput = [
  SquiggleOutput | undefined,
  { rerunSquiggleCode: () => void },
];

export function useSquiggle(args: SquiggleArgs): UseSquiggleOutput {
  // random; https://stackoverflow.com/a/12502559

  const [squiggleOutput, setSquiggleOutput] = useState<
    SquiggleOutput | undefined
  >(undefined);

  const runSquiggle = useCallback(
    async () => {
      const act = async () => {
        setSquiggleOutput((prevOutput) => {
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

        setSquiggleOutput((previousOutput) => {
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
    },

    // This complains about executionId not being used inside the function body.
    // This is on purpose, as executionId simply allows you to run the squiggle
    // code again
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [args.code, args.continues, args.project, args.sourceId]
  );

  useEffect(() => {
    // TODO - cancel previous run if already running
    if (args.autorunMode) {
      runSquiggle();
    }
  }, [runSquiggle]);

  useEffect(() => {
    return () => {
      args.project.removeSource(args.sourceId);
    };
  }, [args.project, args.sourceId]);

  return [squiggleOutput, { rerunSquiggleCode: runSquiggle }];
}
