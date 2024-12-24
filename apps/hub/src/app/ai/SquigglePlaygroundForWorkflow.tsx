import React, { useEffect, useState } from "react";

import { llmLinker } from "@quri/squiggle-ai";
import {
  defaultSquiggleVersion,
  SquigglePlaygroundVersionPicker,
  type SquiggleVersion,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

interface SquigglePlaygroundComponentProps {
  height: number;
  defaultCode: string;
}

// TODO - this is copy-pasted, use another component
export function SquigglePlaygroundForWorkflow({
  height,
  defaultCode,
}: SquigglePlaygroundComponentProps) {
  const [squiggle, setSquiggle] = useState<
    undefined | Awaited<ReturnType<typeof versionedSquigglePackages>>
  >();
  const [version, setVersion] = useState<SquiggleVersion>(
    defaultSquiggleVersion
  );

  const onVersionChange = (version: SquiggleVersion) => {
    setVersion(version);
  };

  useEffect(() => {
    versionedSquigglePackages(version)
      .then((squiggle) => setSquiggle(squiggle))
      .catch(() => setSquiggle(undefined)); // TODO - show an error?

    return () => setSquiggle(undefined);
  }, [version]);

  if (!squiggle) {
    return <div>Loading Squiggle...</div>;
  }

  return (
    <squiggle.components.SquigglePlayground
      height={height}
      defaultCode={defaultCode}
      linker={llmLinker}
      renderExtraControls={() => (
        <div className="flex h-full items-center justify-end gap-2">
          <SquigglePlaygroundVersionPicker
            size="small"
            version={version}
            onChange={onVersionChange}
          />
        </div>
      )}
    />
  );
}
