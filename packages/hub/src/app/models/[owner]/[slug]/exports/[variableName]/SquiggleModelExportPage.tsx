"use client";
import { FC, use } from "react";
import { graphql, useFragment } from "react-relay";

import {
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
  versionSupportsExports,
  versionSupportsSqPathV2,
} from "@quri/versioned-squiggle-components";

import { squiggleHubLinker } from "@/squiggle/components/linker";

import { SquiggleModelExportPage$key } from "@/__generated__/SquiggleModelExportPage.graphql";

type SquiggleProps = {
  variableName: string;
  code: string;
};

// via https://github.com/microsoft/TypeScript/issues/30542#issuecomment-475646727
type GuardedType<T> = T extends (x: any) => x is infer T ? T : never;

type SupportedVersion = GuardedType<(typeof versionSupportsExports)["plain"]>;

const VersionedSquiggleModelExportPage: FC<
  SquiggleProps & {
    version: SupportedVersion;
  }
> = ({ variableName, code, version }) => {
  const props = use(versionedSquigglePackages(version));

  const project = new props.lang.SqProject({
    linker: squiggleHubLinker,
  });

  const rootPathOverride = versionSupportsSqPathV2.props(props)
    ? new props.lang.SqValuePath({
        root: "bindings",
        edges: [props.lang.SqValuePathEdge.fromKey(variableName)],
      })
    : new props.lang.SqValuePath({
        root: "bindings",
        items: [{ type: "string", value: variableName }],
      });

  return (
    <props.components.SquiggleChart
      code={code}
      project={project}
      rootPathOverride={rootPathOverride}
    />
  );
};

export const SquiggleModelExportPage: FC<{
  variableName: string;
  contentRef: SquiggleModelExportPage$key;
}> = ({ variableName, contentRef }) => {
  const content = useFragment(
    graphql`
      fragment SquiggleModelExportPage on SquiggleSnippet {
        id
        code
        version
      }
    `,
    contentRef
  );

  const checkedVersion = useAdjustSquiggleVersion(content.version);

  if (!versionSupportsExports.plain(checkedVersion)) {
    return (
      <div className="p-4 bg-red-100 text-red-900">
        Export view pages don&apos;t support Squiggle {checkedVersion}.
      </div>
    );
  }

  return (
    <VersionedSquiggleModelExportPage
      code={content.code}
      variableName={variableName}
      version={checkedVersion}
    />
  );
};
