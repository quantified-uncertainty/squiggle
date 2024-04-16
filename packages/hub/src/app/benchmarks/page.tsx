"use client";
import { fromByteArray } from "base64-js";
import { deflate } from "pako";
import { FC, useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button, CheckIcon, ErrorIcon, RefreshIcon } from "@quri/ui";
import {
  SquiggleVersion,
  squiggleVersions,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H1, H2 } from "@/components/ui/Headers";

function getPlaygroundUrl(version: SquiggleVersion, code: string) {
  const HASH_PREFIX = "#code=";
  const text = JSON.stringify({ defaultCode: code });
  const compressed = deflate(text, { level: 9 });
  return (
    `https://squiggle-language.com/playground?v=${version}` +
    HASH_PREFIX +
    encodeURIComponent(fromByteArray(compressed))
  );
}

type Outcome = {
  time: number;
  ok: boolean;
};
type Task = {
  code: string;
  version: SquiggleVersion;
  onStart: () => void;
  onFinish: (outcome: Outcome) => void;
};

class Queue {
  tasks: Task[] = [];
  processing: boolean = false;
  processed: number = 0;

  addTask(task: Task) {
    this.tasks.push(task);
    this.process(); // lack of await is intentional
  }

  async process() {
    if (this.processing) {
      return;
    }
    const task = this.tasks[this.processed];
    if (!task) {
      return;
    }
    this.processing = true;
    task.onStart();

    const squiggle = await versionedSquigglePackages(task.version);
    const project = squiggle.lang.SqProject.create();
    project.setSource("main", task.code);

    const started = new Date();
    await project.run("main");
    const result = project.getResult("main");
    const ended = new Date();

    const ms = ended.getTime() - started.getTime();

    task.onFinish({
      ok: result.ok,
      time: ms / 1000,
    });

    this.processed++;
    this.processing = false;

    // try; it won't do anything if queue is empty
    setTimeout(() => this.process(), 5);
  }
}

// singleton; could be wrapped in a Provider
const queue = new Queue();

const Benchmark: FC<{ version: SquiggleVersion; code: string }> = ({
  version,
  code,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | undefined>();

  const run = useCallback(() => {
    queue.addTask({
      version,
      code,
      onStart: () => {
        setIsProcessing(true);
      },
      onFinish: (outcome) => {
        setIsProcessing(false);
        setOutcome(outcome);
      },
    });
  }, [code, version]);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="col-span-2 grid grid-cols-subgrid">
      <div className="font-medium text-slate-700">{version}</div>
      {isProcessing ? (
        <RefreshIcon className="animate-spin text-slate-500" />
      ) : outcome ? (
        <div className="flex items-center gap-1">
          {outcome.ok ? (
            <CheckIcon className="text-green-700" />
          ) : (
            <ErrorIcon className="text-red-500" />
          )}
          <a
            href={getPlaygroundUrl(version, code)}
            className="text-blue-500 hover:underline"
          >
            {outcome.time}s
          </a>
          <Button size="small" onClick={run}>
            Run again
          </Button>
        </div>
      ) : null}
    </div>
  );
};

const BenchmarkTable: FC<{ code: string }> = ({ code }) => {
  return (
    <div>
      <H2>{code}</H2>
      <div className="inline-grid grid-cols-[auto_auto] gap-x-6 gap-y-2">
        {squiggleVersions.map((version) => (
          <Benchmark key={version} code={code} version={version} />
        ))}
      </div>
    </div>
  );
};

/**
 * TODO:
 * - run on server
 * - save results in the database
 * - run multiple times and average the results
 * - more benchmarks
 * - allow separate runs for each benchmark
 */
export default function BenchmarksPage() {
  const codes = [
    "List.upTo(1, 10000) -> map({ |i| i to i + 1 }) -> List.length",
    "List.upTo(1, 1e6) -> map({ |i| i })",
    "List.upTo(1, 1e4) -> map({|x| List.upTo(1, 100) -> reduce(0, {|a,b|a+b})})",
  ];
  return (
    <NarrowPageLayout>
      <H1>Squiggle benchmarks</H1>
      <div className="space-y-8">
        <ReactMarkdown className="prose max-w-4xl" remarkPlugins={[remarkGfm]}>
          {`
Important considerations:

- Keep this page in the foreground when you run benchmarks, otherwise your browser or OS might throttle the execution
- JS engines JIT hot functions after a second or so, so re-runs will be faster than the initial run; this page doesn't account for that yet and doesn't try to warm up the JS engine
    - JIT will happen for each Squiggle version separately
- Some variance between runs is expected, try not to over-update on small differences
- These benchmarks are memory-intense; also, JS will run garbage collection after the test has finished
`}
        </ReactMarkdown>
        <hr />
        {codes.map((code) => (
          <BenchmarkTable key={code} code={code} />
        ))}
      </div>
    </NarrowPageLayout>
  );
}
