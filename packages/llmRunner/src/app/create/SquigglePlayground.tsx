import { useEffect, useState } from "react";

import {
  SquigglePlaygroundVersionPicker,
  type SquiggleVersion,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

interface SquigglePlaygroundComponentProps {
  height: number;
  defaultCode: string;
}

export default function SquigglePlaygroundComponent({
  height,
  defaultCode,
}: SquigglePlaygroundComponentProps) {
  const [squiggle, setSquiggle] = useState<
    undefined | Awaited<ReturnType<typeof versionedSquigglePackages>>
  >();
  const [version, setVersion] = useState<SquiggleVersion>("0.9.3"); // Later versions are often buggy

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
