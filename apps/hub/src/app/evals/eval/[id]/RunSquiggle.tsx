"use client";

import { FC, use, useEffect, useMemo, useState } from "react";

import { getHubLinker } from "@quri/hub-linker";
import { SquiggleViewer } from "@quri/squiggle-components";
import { SqValue } from "@quri/squiggle-lang";
import {
  getPlaygroundUrl,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { StyledLink } from "@/components/ui/StyledLink";
import { SQUIGGLE_PLAYGROUND } from "@/lib/constants";

export const RunSquiggle: FC<{
  code: string;
}> = ({ code }) => {
  const squiggle = use(versionedSquigglePackages("dev"));

  const [result, setResult] = useState<SqValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate playground URL
  const playgroundUrl = useMemo(() => {
    return getPlaygroundUrl({ code, baseUrl: SQUIGGLE_PLAYGROUND }).toString();
  }, [code]);

  useEffect(() => {
    async function runCode() {
      try {
        setIsLoading(true);
        setError(null);

        // Run the code
        const runResult = await squiggle.lang.run(code, {
          linker: getHubLinker(squiggle, {
            hubServer: window.location.origin,
          }) as any,
        });

        if (runResult.result.ok) {
          setResult(runResult.result.value.result);
        } else {
          setError(runResult.result.value.toString());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    }

    runCode();
  }, [code, squiggle]);

  return (
    <div>
      <div className="overflow-hidden rounded border bg-white p-3">
        {isLoading ? (
          <div className="flex h-16 items-center justify-center">
            <div className="text-sm text-gray-500">
              Running Squiggle code...
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">
            <div className="font-medium">Error running Squiggle code:</div>
            <div className="mt-1 whitespace-pre-wrap font-mono text-xs">
              {error}
            </div>
          </div>
        ) : result ? (
          <SquiggleViewer
            value={result}
            chartHeight={25} // the actual height will be 4x, because of "large" size rule
          />
        ) : (
          <div className="text-sm text-gray-500">No result</div>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <StyledLink href={playgroundUrl} target="_blank" className="text-xs">
          Open in Playground
        </StyledLink>
      </div>
    </div>
  );
};
