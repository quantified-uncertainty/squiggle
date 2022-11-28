import {
  result,
  SqError,
  SqProject,
  SqRecord,
  SqValue,
  Env,
} from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";
import { JsImports, jsImportsToSquiggleCode } from "../jsImports";
import * as uuid from "uuid";

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
  jsImports?: JsImports;
  onChange?: (expr: SqValue | undefined, sourceName: string) => void;
} & (StandaloneExecutionProps | ProjectExecutionProps);

export type ResultAndBindings = {
  result: result<SqValue, SqError>;
  bindings: SqRecord;
};

const importSourceName = (sourceName: string) => "imports-" + sourceName;
const defaultContinues = [];

export const useSquiggle = (args: SquiggleArgs): ResultAndBindings => {
  const sourceName = useMemo(() => uuid.v4(), []);
  const projectArg = "project" in args ? args.project : undefined;
  const environment = "environment" in args ? args.environment : undefined;
  const continues =
    "continues" in args ? args.continues ?? [] : defaultContinues;

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

  const result = useMemo(
    () => {
      project.setSource(sourceName, args.code);
      let fullContinues = continues;
      if (args.jsImports && Object.keys(args.jsImports).length) {
        const importsSource = jsImportsToSquiggleCode(args.jsImports);
        project.setSource(importSourceName(sourceName), importsSource);
        fullContinues = continues.concat(importSourceName(sourceName));
      }
      project.setContinues(sourceName, fullContinues);
      project.run(sourceName);
      const result = project.getResult(sourceName);
      const bindings = project.getBindings(sourceName);
      return { result, bindings };
    },
    // This complains about executionId not being used inside the function body.
    // This is on purpose, as executionId simply allows you to run the squiggle
    // code again
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      args.code,
      args.jsImports,
      args.executionId,
      sourceName,
      continues,
      project,
    ]
  );

  const { onChange } = args;

  useEffect(() => {
    onChange?.(result.result.ok ? result.result.value : undefined, sourceName);
  }, [result, onChange, sourceName]);

  useEffect(() => {
    return () => {
      project.removeSource(sourceName);
      if (project.getSource(importSourceName(sourceName)))
        project.removeSource(importSourceName(sourceName));
    };
  }, [project, sourceName]);

  return result;
};
