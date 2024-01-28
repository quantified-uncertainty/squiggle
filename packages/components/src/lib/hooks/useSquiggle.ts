import { useEffect, useMemo, useState } from "react";

import { Env, SqProject } from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../../squiggle-lang/src/public/types.js";
import { WINDOW_VARIABLE_NAME } from "../constants.js";

// Props needed for a standalone execution.
export type StandaloneExecutionProps = {
  project?: undefined;
  environment?: Env;
  continues?: undefined;
};

// Props needed when executing inside a project.
export type ProjectExecutionProps = {
  /** The project that this execution is part of */
  project: SqProject;
  environment?: undefined;
  /** What other squiggle sources from the project to continue. Default [] */
  continues?: string[];
};

export type SquiggleArgs = {
  code: string;
  sourceId?: string;
  executionId?: number;
} & (StandaloneExecutionProps | ProjectExecutionProps);

// TODO - think of a better name, `SquiggleOutput` is too similar to `SqOutput`
export type SquiggleOutput = {
  output: SqOutputResult;
  code: string;
  executionId: number;
  executionTime: number;
};

export type UseSquiggleOutput = [
  SquiggleOutput | undefined,
  {
    project: SqProject;
    isRunning: boolean;
    sourceId: string; // if you don't provide `sourceId` in `SquiggleArgs` then it will be picked randomly
  },
];

// this array's identity must be constant because it's used in useEffect below
const defaultContinues: string[] = [];

export function useSquiggle(args: SquiggleArgs): UseSquiggleOutput {
  // random; https://stackoverflow.com/a/12502559
  // TODO - React.useId?
  const sourceId = useMemo(() => {
    return args.sourceId ?? Math.random().toString(36).slice(2);
  }, [args.sourceId]);

  const projectArg = "project" in args ? args.project : undefined;
  const environment = "environment" in args ? args.environment : undefined;
  const continues =
    "continues" in args ? args.continues ?? defaultContinues : defaultContinues;

  const project = useMemo(() => {
    if (projectArg) {
      return projectArg;
    } else {
      const p = SqProject.create();
      if (environment) {
        p.setEnvironment(environment);
      }
      return p;
    }
  }, [projectArg, environment]);

  const [isRunning, setIsRunning] = useState(false);

  const [squiggleOutput, setSquiggleOutput] = useState<
    SquiggleOutput | undefined
  >(undefined);

  const { executionId = 1 } = args;

  useEffect(
    () => {
      // TODO - cancel previous run if already running
      setIsRunning(true);

      const act = async () => {
        const startTime = Date.now();
        project.setSource(sourceId, args.code);
        project.setContinues(sourceId, continues);
        await project.run(sourceId);
        const output = project.getOutput(sourceId);
        const executionTime = Date.now() - startTime;

        setSquiggleOutput({
          output,
          code: args.code,
          executionId,
          executionTime,
        });
        setIsRunning(false);

        //Set the output to the window so that it can be accessed by users/developers there
        //This is useful for debugging
        if (typeof window !== "undefined") {
          if (!window[WINDOW_VARIABLE_NAME]) {
            window[WINDOW_VARIABLE_NAME] = {};
          }
          window[WINDOW_VARIABLE_NAME][sourceId] = {
            output,
            code: args.code,
            executionId,
            executionTime,
            startTime,
          };
        }
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
    [args.code, executionId, sourceId, continues, project]
  );

  useEffect(() => {
    return () => {
      project.removeSource(sourceId);
    };
  }, [project, sourceId]);

  return [
    squiggleOutput,
    {
      project,
      isRunning,
      sourceId,
    },
  ];
}
