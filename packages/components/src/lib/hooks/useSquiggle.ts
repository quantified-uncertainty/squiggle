import { environment, SqProject, SqValue } from "@quri/squiggle-lang";
import { useEffect, useMemo } from "react";
import { JsImports, jsImportsToSquiggleCode } from "../jsImports";
import { v4 as uuidv4 } from "uuid";

type SquiggleArgs = {
  code?: string;
  executionId?: number;
  jsImports?: JsImports;
  environment?: environment;
  project: SqProject;
  sourceName?: string;
  includes: string[];
  onChange?: (expr: SqValue | undefined, sourceName: string) => void;
};

const importSourceName = (sourceName: string) => "imports-" + sourceName;

export const useSquiggle = (args: SquiggleArgs) => {
  const autogenName = useMemo(() => uuidv4(), []);

  const result = useMemo(
    () => {
      const project = args.project;
      let needsClean = true;

      let sourceName = "";
      // If the user specified a source and it already exists, assume we don't
      // own the source
      if (args.sourceName && project.getSource(args.sourceName)) {
        needsClean = false;
        sourceName = args.sourceName;
      } else {
        // Otherwise create a source, either with the name given or an automatic one
        if (args.sourceName) {
          sourceName = args.sourceName;
        } else {
          sourceName = autogenName;
        }
        project.setSource(sourceName, args.code ?? "");
      }
      let includes = args.includes;
      if (args.environment) {
        project.setEnvironment(args.environment);
      }
      if (args.jsImports && Object.keys(args.jsImports).length) {
        const importsSource = jsImportsToSquiggleCode(args.jsImports);
        project.setSource(importSourceName(sourceName), importsSource);
        includes.push(importSourceName(sourceName));
      }
      project.setContinues(sourceName, includes);
      project.run(sourceName);
      const result = project.getResult(sourceName);
      const bindings = project.getBindings(sourceName);
      return { result, bindings, sourceName, needsClean };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [args.code, args.environment, args.jsImports, args.executionId]
  );

  const { onChange } = args;

  useEffect(() => {
    onChange?.(
      result.result.tag === "Ok" ? result.result.value : undefined,
      result.sourceName
    );
  }, [result, onChange]);

  useEffect(() => {
    return () => {
      if (result.needsClean) args.project.clean(result.sourceName);
      if (args.project.getSource(importSourceName(result.sourceName)))
        args.project.clean(result.sourceName);
    };
  }, 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  return result;
};
