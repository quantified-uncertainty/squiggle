"use client";
import { FC, useState } from "react";
import { graphql, useFragment } from "react-relay";
import * as squiggleLang_0_9_0 from "squiggle-lang-0.9.0";

import * as squiggleLang_dev from "@quri/squiggle-lang";
import {
  useAdjustSquiggleVersion,
  VersionedSquiggleChart,
} from "@quri/versioned-squiggle-components";

import { squiggleHubLinker } from "@/squiggle/components/linker";

import { SquiggleModelExportPage$key } from "@/__generated__/SquiggleModelExportPage.graphql";

type SquiggleProps = {
  variableName: string;
  code: string;
};

const SquiggleModelExportPage_9_0_0: FC<SquiggleProps> = ({
  variableName,
  code,
}) => {
  const [{ project, rootPath }] = useState(() => {
    const project = new squiggleLang_0_9_0.SqProject({
      linker: squiggleHubLinker,
    });
    const rootPath = new squiggleLang_0_9_0.SqValuePath({
      root: "bindings",
      items: [{ type: "string", value: variableName }],
    });
    return { project, rootPath };
  });

  return (
    <VersionedSquiggleChart
      version="0.9.0"
      code={code}
      rootPathOverride={rootPath}
      project={project}
    />
  );
};

const SquiggleModelExportPage_dev: FC<SquiggleProps> = ({
  variableName,
  code,
}) => {
  const [{ project, rootPath }] = useState(() => {
    const project = new squiggleLang_dev.SqProject({
      linker: squiggleHubLinker,
    });
    const rootPath = new squiggleLang_dev.SqValuePath({
      root: "bindings",
      items: [{ type: "string", value: variableName }],
    });
    return { project, rootPath };
  });

  return (
    <VersionedSquiggleChart
      version="dev"
      code={code}
      rootPathOverride={rootPath}
      project={project}
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

  if (checkedVersion === "0.8.5" || checkedVersion === "0.8.6") {
    return (
      <div className="p-4 bg-red-100 text-red-900">
        Export view pages don&apos;t support Squiggle {checkedVersion}.
      </div>
    );
  }

  switch (checkedVersion) {
    case "0.9.0":
      return (
        <SquiggleModelExportPage_9_0_0
          code={content.code}
          variableName={variableName}
        />
      );
    case "dev":
      return (
        <SquiggleModelExportPage_dev
          code={content.code}
          variableName={variableName}
        />
      );
    default:
      throw new Error(`Wrong version ${checkedVersion satisfies never}`);
  }
};
