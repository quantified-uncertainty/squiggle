import { FC, useEffect, useRef } from "react";

import { type Simulation, useSimulator } from "@quri/squiggle-components";
import type { SqProject } from "@quri/squiggle-lang";

type Props = {
  path: string; // the source id: the root-relative path
  code: string;
  // A fresh project per `runEpoch`; the parent keys RunHost by it too.
  project: SqProject;
  autorun: boolean;
  // Every change of the simulation (a run started, a run finished).
  onRun: (simulation: Simulation | undefined) => void;
  // Set to the function that runs the current code now (⌘↵).
  runRef: { current: (() => void) | undefined };
};

// Runs a .squiggle file and reports its runs upward; renders nothing (#10).
//
// The file workspace keys RunHost by `runEpoch`, which the workspace bumps when
// an imported file's content changed on disk: only the SqProject (and its
// module cache) is replaced, while the editor, the code pane and the views
// stay mounted and keep showing the last run until the new one finishes.
//
// With auto-run off, edits don't run until ⌘↵, but a newly mounted RunHost
// (opening the file, or an import change) runs once, so there is always a run
// to show.
export const RunHost: FC<Props> = ({
  path,
  code,
  project,
  autorun,
  onRun,
  runRef,
}) => {
  const { simulation, runSimulation, setAutorunMode } = useSimulator({
    code,
    sourceId: path,
    setup: { type: "project", project },
    initialAutorunMode: autorun,
  });

  useEffect(() => {
    setAutorunMode(autorun);
  }, [autorun, setAutorunMode]);

  const runSimulationRef = useRef(runSimulation);
  runSimulationRef.current = runSimulation;
  useEffect(() => {
    if (!autorun) runSimulationRef.current();
    // Only when mounted: the initial run with auto-run off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  runRef.current = runSimulation;
  useEffect(
    () => () => {
      if (runRef.current === runSimulationRef.current) {
        runRef.current = undefined;
      }
    },
    [runRef]
  );

  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;
  useEffect(() => {
    onRunRef.current(simulation);
  }, [simulation]);

  return null;
};
