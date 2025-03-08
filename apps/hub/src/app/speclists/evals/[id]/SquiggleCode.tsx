"use client";

import { use, useMemo } from "react";

import { SquiggleEditor } from "@quri/squiggle-components";
import { versionedSquigglePackages } from "@quri/versioned-squiggle-components";

import { sqProjectWithHubLinker } from "@/squiggle/linker";

export default function SquiggleCode({ code }: { code: string }) {
  const squiggle = use(versionedSquigglePackages("dev"));

  const project = useMemo(() => sqProjectWithHubLinker(squiggle), [squiggle]);

  return (
    <div className="overflow-hidden rounded border bg-gray-50">
      <SquiggleEditor defaultCode={code} project={project} />
    </div>
  );
}
