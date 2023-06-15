import { useEffect, useMemo, useState } from "react";

import {
  result,
  SqError,
  SqProject,
  SqRecord,
  SqValue,
  Env,
} from "@quri/squiggle-lang";

// Props needed for a standalone execution
type StandaloneExecutionProps = {
  /** The amount of points returned to draw the distribution, not needed if using a project */
  environment?: Env;
};

// Props needed when executing inside a project.
type ProjectExecutionProps = {
  /** The project that this execution is part of */
  project: SqProject;
  /** What other squiggle sources from the project to continue. Default [] */
  continues?: string[];
};

export type SquiggleArgs = {
  code: string;
  executionId?: number;
  onChange?: (expr: SqValue | undefined, sourceName: string) => void;
} & (StandaloneExecutionProps | ProjectExecutionProps);

export type SquiggleOutput = {
  result: result<SqValue, SqError>;
  bindings: SqRecord;
  code: string;
  executionId: number;
  executionTime: number;
};

export type UseSquiggleOutput = [
  SquiggleOutput | undefined,
  {
    project: SqProject;
    isRunning: boolean;
  }
];

// this array's identity must be constant because it's used in useEffect below
const defaultContinues = [];

export function useSquiggle(args: SquiggleArgs): UseSquiggleOutput {
  // random; https://stackoverflow.com/a/12502559
  // TODO - React.useId?
  const sourceName = useMemo(() => Math.random().toString(36).slice(2), []);

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

  const { executionId = 1, onChange } = args;

  useEffect(
    () => {
      // TODO - cancel previous run if already running
      setIsRunning(true);

      const channel = new MessageChannel();

      // trick from https://stackoverflow.com/a/56727837
      channel.port1.onmessage = async () => {
        const startTime = Date.now();
        project.setSource(sourceName, args.code);
        project.setContinues(sourceName, continues);
        await project.run(sourceName);
        const result = project.getResult(sourceName);
        const bindings = project.getBindings(sourceName);
        setSquiggleOutput({
          result,
          bindings,
          code: args.code,
          executionId,
          executionTime: Date.now() - startTime,
        });
        setIsRunning(false);
      };

      requestAnimationFrame(function () {
        channel.port2.postMessage(undefined);
      });
    },
    // This complains about executionId not being used inside the function body.
    // This is on purpose, as executionId simply allows you to run the squiggle
    // code again
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [args.code, executionId, sourceName, continues, project]
  );

  useEffect(() => {
    if (!squiggleOutput || isRunning) {
      return;
    }
    onChange?.(
      squiggleOutput.result.ok ? squiggleOutput.result.value : undefined,
      sourceName
    );
  }, [squiggleOutput, isRunning, onChange, sourceName]);

  useEffect(() => {
    return () => {
      project.removeSource(sourceName);
    };
  }, [project, sourceName]);

  return [
    squiggleOutput,
    {
      project,
      isRunning: executionId !== squiggleOutput?.executionId,
    },
  ];
}
