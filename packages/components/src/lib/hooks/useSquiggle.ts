import { useCallback, useEffect, useRef, useState } from "react";

import { Env, SqProject } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { useForceUpdate } from "./useForceUpdate.js";

export type SquiggleArgs = {
  code: string;
  sourceId: string;
  executionId?: number;
  project: SqProject;
  continues: string[];
  environment?: Env;
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
  UpcomingSquiggleOutput | undefined,
  { reRun: () => void },
];

export function useSquiggle(args: SquiggleArgs): UseSquiggleOutput {
  // random; https://stackoverflow.com/a/12502559

  const squiggleOutputRef = useRef<SquiggleOutput | undefined>(undefined);
  const executionIdRef = useRef<number>(0);

  const forceUpdate = useForceUpdate();
  const [upcomingSquiggleOutput, setUpcomingSquiggleOutput] = useState<
    UpcomingSquiggleOutput | undefined
  >(undefined);

  const runSquiggle = useCallback(
    async () => {
      const act = async () => {
        const startTime = Date.now();
        args.project.setSource(args.sourceId, args.code);
        args.project.setContinues(args.sourceId, args.continues);

        if (squiggleOutputRef.current) {
          squiggleOutputRef.current = {
            ...squiggleOutputRef.current,
            isStale: true,
          };
        }

        await args.project.run(args.sourceId);
        const output = args.project.getOutput(args.sourceId);
        const executionTime = Date.now() - startTime;

        forceUpdate();

        squiggleOutputRef.current = {
          output,
          code: args.code,
          executionId: executionIdRef.current++,
          executionTime,
          isStale: false,
        };

        setUpcomingSquiggleOutput(undefined);
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
    [
      args.code,
      args.continues,
      args.project,
      args.sourceId,
      setUpcomingSquiggleOutput,
      forceUpdate,
    ]
  );

  useEffect(() => {
    // TODO - cancel previous run if already running
    runSquiggle();
  }, [runSquiggle]);

  useEffect(() => {
    return () => {
      args.project.removeSource(args.sourceId);
    };
  }, [args.project, args.sourceId]);

  return [
    squiggleOutputRef.current,
    upcomingSquiggleOutput,
    { reRun: runSquiggle },
  ];
}
