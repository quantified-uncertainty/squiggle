"use client";
import { fromByteArray } from "base64-js";
import { deflate } from "pako";
import { FC, Fragment, useEffect, useState } from "react";

import { CheckIcon, ErrorIcon, RefreshIcon } from "@quri/ui";
import {
  SquiggleVersion,
  squiggleVersions,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H2 } from "@/components/ui/Headers";

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

const Benchmark: FC<{ code: string }> = ({ code }) => {
  type Outcome = {
    time: number;
    ok: boolean;
  };

  const [outcomes, setOutcomes] = useState<
    Partial<Record<SquiggleVersion, Outcome>>
  >({});

  useEffect(() => {
    const run = async () => {
      for (const version of squiggleVersions) {
        const squiggle = await versionedSquigglePackages(version);
        const project = squiggle.lang.SqProject.create();
        project.setSource("main", code);

        const started = new Date();
        await project.run("main");
        const result = project.getResult("main");
        const ended = new Date();

        const ms = ended.getTime() - started.getTime();
        setOutcomes((outcomes) => ({
          ...outcomes,
          [version]: {
            time: ms / 1000,
            ok: result.ok,
          },
        }));
      }
    };

    run();
  }, [code]);

  return (
    <div>
      <H2>{code}</H2>
      <div className="inline-grid grid-cols-2 gap-2">
        {squiggleVersions.map((version) => (
          <Fragment key={version}>
            <div className="text-slate-700 font-medium">{version}</div>
            {outcomes[version] ? (
              <div className="flex gap-1 items-center">
                {outcomes[version]!.ok ? (
                  <CheckIcon className="text-green-700" />
                ) : (
                  <ErrorIcon className="text-red-500" />
                )}
                <a
                  href={getPlaygroundUrl(version, code)}
                  className="text-blue-500 hover:underline"
                >
                  {outcomes[version]!.time}s
                </a>
              </div>
            ) : (
              <RefreshIcon className="text-slate-500 animate-spin" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default function BenchmarksPage() {
  const codes = [
    "List.upTo(1, 50000) -> map({|i| i to i + 1}) -> List.length",
    "X = 5",
  ];
  return (
    <NarrowPageLayout>
      <div className="space-y-8">
        {codes.map((code) => (
          <Benchmark key={code} code={code} />
        ))}
      </div>
    </NarrowPageLayout>
  );
}
