"use client";
import { FC, useEffect, useState } from "react";

import { run } from "@quri/squiggle-lang";

import { RelativeValuesTab } from "../components/RelativeValuesDashboard.js";
import { RelativeValuesSpecDashboard } from "../components/RelativeValuesSpecDashboard.js";
import {
  findRelativeValuesExports,
  RelativeValuesExport,
} from "../spec/findExports.js";

// Runs Squiggle code and shows dashboards for all relative values specs in it.
export const ExampleDashboard: FC<{
  code: string;
  initialTab?: RelativeValuesTab;
}> = ({ code, initialTab }) => {
  const [found, setFound] = useState<RelativeValuesExport[] | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    run(code)
      .then((output) => setFound(findRelativeValuesExports(output)))
      .catch((e: unknown) => setError(String(e)));
  }, [code]);

  if (error) {
    return <div className="text-red-700">{error}</div>;
  }

  if (!found) {
    return <div>Running...</div>;
  }
  if (!found.length) {
    return <div>No relative values specs found</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      {found.map(({ name, spec }) =>
        spec.ok ? (
          <RelativeValuesSpecDashboard
            key={name}
            spec={spec.value}
            modelCode={code}
            initialTab={initialTab}
            getPlaygroundUrl={(code) =>
              `https://squiggle-language.com/playground#code=${encodeURIComponent(code)}`
            }
          />
        ) : (
          <div key={name} className="text-red-700">
            {name}: {spec.value}
          </div>
        )
      )}
    </div>
  );
};
