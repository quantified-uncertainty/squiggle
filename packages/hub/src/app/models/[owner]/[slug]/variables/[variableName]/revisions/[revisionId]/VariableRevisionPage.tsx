"use client";
import { FC, use } from "react";

import {
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
  versionSupportsExports,
  versionSupportsSqPathV2,
} from "@quri/versioned-squiggle-components";

import { sqProjectWithHubLinker } from "@/squiggle/linker";
import { VariableRevisionFullDTO } from "@/variables/data/fullVariableRevision";

type SquiggleProps = {
  variableName: string;
  code: string;
};

// via https://github.com/microsoft/TypeScript/issues/30542#issuecomment-475646727
type GuardedType<T> = T extends (x: any) => x is infer T ? T : never;

type SupportedVersion = GuardedType<(typeof versionSupportsExports)["plain"]>;

const VersionedSquiggleVariableRevisionPage: FC<
  SquiggleProps & {
    version: SupportedVersion;
  }
> = ({ variableName, code, version }) => {
  const squiggle = use(versionedSquigglePackages(version));

  const project = sqProjectWithHubLinker(squiggle);

  const rootPathOverride = versionSupportsSqPathV2.object(squiggle)
    ? new squiggle.lang.SqValuePath({
        root: "bindings",
        edges: [squiggle.lang.SqValuePathEdge.fromKey(variableName)],
      })
    : new squiggle.lang.SqValuePath({
        root: "bindings",
        items: [{ type: "string", value: variableName }],
      });

  return (
    <squiggle.components.SquiggleChart
      code={code}
      project={project}
      rootPathOverride={rootPathOverride}
    />
  );
};

export const VariableRevisionPage: FC<{
  revision: VariableRevisionFullDTO;
}> = ({ revision }) => {
  const content = revision.modelRevision.squiggleSnippet;

  const checkedVersion = useAdjustSquiggleVersion(content.version);

  if (!versionSupportsExports.plain(checkedVersion)) {
    return (
      <div className="bg-red-100 p-4 text-red-900">
        Variable view pages don&apos;t support Squiggle {checkedVersion}.
      </div>
    );
  }

  return (
    <VersionedSquiggleVariableRevisionPage
      code={content.code}
      variableName={revision.variableName}
      version={checkedVersion}
    />
  );
};
