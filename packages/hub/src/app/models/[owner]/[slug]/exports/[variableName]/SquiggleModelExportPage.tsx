"use client";
import { FC, use, useState } from "react";
import { graphql, useFragment } from "react-relay";

import {
  squiggleLangByVersion,
  useAdjustSquiggleVersion,
  VersionedSquiggleChart,
  versionSupportsExports,
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
  // `use` is still experimental in React, but this is Squiggle Hub which uses Next.js which uses canary React releases, so it's fine
  const squiggleLang = use(squiggleLangByVersion(version));

  const [{ project, rootPath }] = useState(() => {
    const project = new squiggleLang.SqProject({
      linker: squiggleHubLinker,
    });
    const rootPath = new squiggleLang.SqValuePath({
      root: "bindings",
      items: [{ type: "string", value: variableName }],
    });
    return { project, rootPath };
  });

  return (
    <VersionedSquiggleChart
      version={version}
      code={code}
      rootPathOverride={rootPath}
      // TODO - we still don't have a good way to sync up squiggle-lang and versioned squiggle-components types
      project={project as any}
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
