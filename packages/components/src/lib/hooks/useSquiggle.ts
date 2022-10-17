import {
  result,
  SqError,
  SqProject,
  SqRecord,
  SqValue,
  environment,
} from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";
import { JsImports, jsImportsToSquiggleCode } from "../jsImports";
import * as uuid from "uuid";

export type SquiggleArgs = {
  code: string;
  executionId?: number;
  jsImports?: JsImports;
  onChange?: (
    expr: result<SqValue, SqError> | undefined,
    sourceName: string
  ) => void;
} & (StandaloneExecutionProps | ProjectExecutionProps);

// Props needed for a standalone execution
type StandaloneExecutionProps = {
  /** The amount of points returned to draw the distribution, not needed if using a project */
  environment?: environment;
};

// Props needed when executing inside a project.
type ProjectExecutionProps = {
  /** The project that this execution is part of */
  project: SqProject;
  /** What other squiggle sources from the project to continue. Default [] */
  continues?: string[];
};

export type ResultAndBindings = {
  result: result<SqValue, SqError>;
  bindings: SqRecord;
};

const importSourceName = (sourceName: string) => "imports-" + sourceName;
const defaultContinues = [];

export const useSquiggle = (args: SquiggleArgs): ResultAndBindings => {
  const sourceName = useMemo(() => uuid.v4(), []);
  const project = "project" in args ? args.project : undefined;
  const environment = "environment" in args ? args.environment : undefined;
  const continues =
    "continues" in args ? args.continues ?? [] : defaultContinues;

  const p = useMemo(() => {
    if (project) {
      return project;
    } else {
      const p = SqProject.create();
      if (environment) {
        p.setEnvironment(environment);
      }
      return p;
    }
  }, [project, environment]);

  const result = useMemo(
    () => {
      const project = p;

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
    [args.code, args.jsImports, args.executionId, sourceName, continues, p]
  );

  const { onChange } = args;

  useEffect(() => {
    onChange?.(result.result, sourceName);
  }, [result, onChange, sourceName]);

  useEffect(() => {
    return () => {
      p.removeSource(sourceName);
      if (p.getSource(importSourceName(sourceName)))
        p.removeSource(importSourceName(sourceName));
    };
  }, [p, sourceName]);

  return result;
};
