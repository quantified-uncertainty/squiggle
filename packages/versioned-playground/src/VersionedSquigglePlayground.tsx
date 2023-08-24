"use client";
import { FC, ReactNode, useMemo, lazy, Suspense } from "react";

import { useToast } from "@quri/ui";

// Imported non-dynamically as a demo of version pinning.
// 0.8.4 had `exports` configuration in its `package.json` which wasn't compatible with Next.js resolutions.
// For this reason, support for 0.8.4 should be removed later (preferably before the PR is merged).
import { SquigglePlayground as Playground084 } from "squiggle-components-0.8.4";

import {
  SquiggleVersion,
  checkSquiggleVersion,
  defaultSquiggleVersion,
} from "./versions.js";

// Note: typing this with `{ [k in Version]: ComponentType<CommonProps> }` won't work because of contravariance issues.
// Instead, we pass all props explicitly to the playground component when it's instantiated to check that all props are compatible.
const playgroundByVersion = {
  "0.8.4": Playground084,
  dev: lazy(async () => ({
    default: (await import("@quri/squiggle-components")).SquigglePlayground,
  })),
};

// We expect all playground components to be a subtype of this type.
type CommonProps = {
  defaultCode?: string;
  distributionChartSettings?: { showSummary?: boolean }; // simplified
  renderExtraControls?: (options: {
    openModal: (name: string) => void;
  }) => ReactNode;
  renderExtraModal?: (name: string) =>
    | {
        title: string;
        body: ReactNode;
      }
    | undefined;
  onCodeChange?: (code: string) => void;
  onSettingsChange?: (settings: {
    distributionChartSettings: { showSummary: boolean };
  }) => void;
  height?: string | number;
};

type Props = CommonProps & {
  version: string; // not SquiggleVersion, because it's easier to validate the version inside this component
};

export const VersionedSquigglePlayground: FC<Props> = ({
  version,
  ...props
}) => {
  const toast = useToast();

  const usedVersion = useMemo<SquiggleVersion>(() => {
    if (!checkSquiggleVersion(version)) {
      toast(
        `Playground for version ${version} is not available. Rendering with
          ${defaultSquiggleVersion} instead.`,
        "error"
      );
      return defaultSquiggleVersion;
    }
    return version;
  }, [version, toast]);

  const Playground = playgroundByVersion[usedVersion];

  // TODO - Suspense?
  return (
    <Suspense fallback={null}>
      <Playground
        // Listing all props for better type safety, instead of using `{...props}`.
        // Playground props shape can change in the future and this allows us to catch those cases early.
        defaultCode={props.defaultCode}
        distributionChartSettings={props.distributionChartSettings}
        renderExtraControls={props.renderExtraControls}
        renderExtraModal={props.renderExtraModal}
        onCodeChange={props.onCodeChange}
        onSettingsChange={props.onSettingsChange}
        height={props.height}
      />
    </Suspense>
  );
};
