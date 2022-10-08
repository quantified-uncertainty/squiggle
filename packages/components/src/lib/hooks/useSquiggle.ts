import {
  result,
  SqError,
  SqProject,
  SqRecord,
  SqValue,
} from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";
import { JsImports, jsImportsToSquiggleCode } from "../jsImports";
import * as uuid from "uuid";

type SquiggleArgs = {
  code: string;
  executionId?: number;
  jsImports?: JsImports;
  project: SqProject;
  continues?: string[];
  onChange?: (expr: SqValue | undefined, sourceName: string) => void;
};

export type ResultAndBindings = {
  result: result<SqValue, SqError>;
  bindings: SqRecord;
};

const importSourceName = (sourceName: string) => "imports-" + sourceName;
const defaultContinues = [];

export const useSquiggle = (args: SquiggleArgs): ResultAndBindings => {
  const sourceName = useMemo(() => uuid.v4(), []);

  const env = args.project.getEnvironment();
  const continues = args.continues || defaultContinues;

  const result = useMemo(
    () => {
      const project = args.project;

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
      args.project,
      env,
    ]
  );

  const { onChange } = args;

  useEffect(() => {
    onChange?.(
      result.result.tag === "Ok" ? result.result.value : undefined,
      sourceName
    );
  }, [result, onChange, sourceName]);

  useEffect(() => {
    return () => {
      args.project.removeSource(sourceName);
      if (args.project.getSource(importSourceName(sourceName)))
        args.project.removeSource(importSourceName(sourceName));
    };
  }, [args.project, sourceName]);

  return result;
};
