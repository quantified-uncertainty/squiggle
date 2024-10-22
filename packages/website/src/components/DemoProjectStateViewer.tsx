"use client";
import { Tabs } from "nextra/components";
import { FC, forwardRef, useImperativeHandle, useRef, useState } from "react";

import { ProjectStateViewer } from "@quri/squiggle-components";
import {
  makeSelfContainedLinker,
  runnerByName,
  SqLinker,
  SqProject,
} from "@quri/squiggle-lang";
import { Button } from "@quri/ui";

import { BaseRunner } from "../../../squiggle-lang/dist/runners/BaseRunner";
import { Resettable } from "./Resettable";

type Handle = {
  addPending: (name: string) => Promise<void>;
  reset: () => void;
};

const PendingButtonsList = forwardRef<Handle>(
  function PendingButtonsList(_, ref) {
    const [pendingPromises, setPendingPromises] = useState<
      {
        name: string;
        resolve: () => void;
      }[]
    >([]);

    useImperativeHandle(ref, () => ({
      addPending: (name: string) => {
        const promise = new Promise<void>((resolve) => {
          setPendingPromises((pendingPromises) => [
            ...pendingPromises,
            { name, resolve },
          ]);
        });
        return promise;
      },
      reset: () => setPendingPromises([]),
    }));

    return (
      <div className="flex gap-1">
        {pendingPromises.map((pendingPromise, i) => (
          <Button
            key={i}
            size="small"
            onClick={() => {
              pendingPromise.resolve();
              setPendingPromises((pendingPromises) =>
                pendingPromises.filter((p) => p !== pendingPromise)
              );
            }}
          >
            {pendingPromise.name}
          </Button>
        ))}
      </div>
    );
  }
);

const Wrapper: FC<{
  linker: SqLinker;
  headName: string;
  headModule: string;
  runner: BaseRunner;
}> = ({ linker, headName, headModule, runner }) => {
  // `useState` instead of `useMemo` because in React 18 `useMemo` is called twice in dev in strict mode
  const [project] = useState(() => {
    const project = new SqProject({
      linker,
      runner,
    });
    setTimeout(() => {
      project.loadHead(headName, { moduleName: headModule });
    }, 100);
    return project;
  });

  return (
    <div style={{ height: 360 }}>
      <ProjectStateViewer project={project} />
    </div>
  );
};

const DemoProjectStateViewerTab: FC<{
  modules: Record<string, string>;
  headName: string;
  headModule: string;
  manual: boolean;
}> = ({ modules, headName, headModule, manual }) => {
  const pendingListRef = useRef<Handle>(null);
  let linker = makeSelfContainedLinker(modules);
  if (manual) {
    const originalLinker = linker;
    linker = {
      ...linker,
      loadModule: async (name) => {
        await pendingListRef.current?.addPending(`Load ${name}`);
        return originalLinker.loadModule(name);
      },
    };
  }

  const runner = runnerByName(
    typeof window === "undefined" ? "embedded" : "web-worker"
  );
  if (manual) {
    const originalRun = runner.run.bind(runner);
    runner.run = async (params) => {
      await pendingListRef.current?.addPending(
        `Run ${params.module.expectAst().location.source}`
      );
      return originalRun(params);
    };
  }

  return (
    <Resettable
      controls={() =>
        manual ? <PendingButtonsList ref={pendingListRef} /> : null
      }
      onReset={() => pendingListRef.current?.reset()}
    >
      {() => (
        <Wrapper
          linker={linker}
          runner={runner}
          headName={headName}
          headModule={headModule}
        />
      )}
    </Resettable>
  );
};

export const DemoProjectStateViewer: FC<{
  modules: Record<string, string>;
  headName: string;
  headModule: string;
}> = ({ modules, headName, headModule }) => {
  return (
    <Tabs items={["Manual", "Automatic"]}>
      {[true, false].map((manual) => (
        <Tabs.Tab key={String(manual)}>
          <DemoProjectStateViewerTab
            modules={modules}
            headName={headName}
            headModule={headModule}
            manual={manual}
          />
        </Tabs.Tab>
      ))}
    </Tabs>
  );
};
