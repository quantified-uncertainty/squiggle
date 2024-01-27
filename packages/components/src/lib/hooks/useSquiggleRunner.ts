import { useEffect, useMemo, useState } from "react";

import { Env, SqProject } from "@quri/squiggle-lang";

import { defaultViewerTab, ViewerTab } from "../utility.js";
import {
  SquiggleProjectRun,
  useSquiggleProjectRun,
} from "./useSquiggleProjectRun.js";

type SetupSettings =
  | { type: "standalone"; environment?: Env } // For standalone execution
  | { type: "project"; project: SqProject; continues?: string[] }; // Project for the parent execution. Continues is what other squiggle sources to continue. Default []

export type SquiggleRunnerArgs = {
  code: string;
  sourceId?: string;
  setup: SetupSettings;
};

export type SquiggleRunnerOutput = {
  sourceId: string;
  squiggleProjectRun?: SquiggleProjectRun;
  project: SqProject;

  viewerTab: ViewerTab;
  setViewerTab: (newValue: ViewerTab) => void;

  autorunMode: boolean;
  setAutorunMode: (newValue: boolean) => void;

  setProjectEnvironment: (newEnv: Env) => void;
  rerunSquiggleCode: () => void;

  seed: string;
  setSeed: (newValue: string) => void;
};

export function getIsRunning(squiggleProjectRun: SquiggleProjectRun): boolean {
  return squiggleProjectRun.isStale ?? false;
}

const defaultContinues: string[] = [];

function useSetup(sourceId: string | undefined, setup: SetupSettings) {
  const _sourceId = useMemo(() => {
    // random; https://stackoverflow.com/a/12502559
    return sourceId ?? Math.random().toString(36).slice(2);
  }, [sourceId]);

  const continues =
    setup.type === "standalone"
      ? defaultContinues
      : setup.continues ?? defaultContinues;

  const project = useMemo(() => {
    if (setup.type === "project") {
      return setup.project;
    } else {
      const _project = SqProject.create();
      if (setup.environment) {
        _project.setEnvironment(setup.environment);
      }
      return _project;
    }
  }, [setup]);

  return { sourceId: _sourceId, project, continues };
}

export function useSquiggleRunner(
  args: SquiggleRunnerArgs
): SquiggleRunnerOutput {
  const [autorunMode, setAutorunMode] = useState(true);
  const [seed, setSeed] = useState<string>("starting-seed");

  const [viewerTab, setViewerTab] = useState<ViewerTab | undefined>(undefined);

  const { sourceId, project, continues } = useSetup(args.sourceId, args.setup);

  const [squiggleProjectRun, { rerunSquiggleCode }] = useSquiggleProjectRun({
    sourceId,
    code: args.code,
    project,
    continues,
    autorunMode,
  });

  // Set viewerTab the first time that SqOutputResult is not undefined.
  useEffect(() => {
    if (!viewerTab && squiggleProjectRun?.output) {
      setViewerTab(defaultViewerTab(squiggleProjectRun.output));
    }
  }, [squiggleProjectRun?.output, viewerTab]);

  // Allow callers to update the environment, outside of the normal SquiggleRunnerArgs setup.
  // It could be nice in the future to have ``environment`` be passed in only as a regular prop, but this would complicate the SetupSettings input.
  const updateEnvironment = useMemo(
    () => (newEnv: Env) => {
      project.setEnvironment(newEnv);
      if (autorunMode) {
        rerunSquiggleCode();
      }
    },
    [autorunMode, project, rerunSquiggleCode]
  );

  return {
    sourceId,
    squiggleProjectRun,
    project,

    viewerTab: viewerTab ?? defaultViewerTab(undefined),
    setViewerTab,

    autorunMode,
    setAutorunMode: setAutorunMode,

    setProjectEnvironment: updateEnvironment,
    rerunSquiggleCode: rerunSquiggleCode,

    seed,
    setSeed,
  };
}
