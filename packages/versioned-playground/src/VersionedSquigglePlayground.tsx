"use client";
import { FC, ReactNode, useMemo, lazy, Suspense } from "react";

import { useToast } from "@quri/ui";

import {
  SquiggleVersion,
  checkSquiggleVersion,
  defaultSquiggleVersion,
} from "./versions.js";

// Note: typing this with `{ [k in Version]: ComponentType<CommonProps> }` won't work because of contravariance issues.
// Instead, we pass all props explicitly to the playground component when it's instantiated to check that all props are compatible.
// Also, please don't change the formatting of this declaration unless you have to. It's edited with regexes in `publish-all.ts` script.
// (TODO: using codemod would be nice)
const playgroundByVersion = {
  "0.8.5": lazy(async () => ({
    default: (await import("squiggle-components-0.8.5")).SquigglePlayground,
  })),
  "0.8.6": lazy(async () => ({
    default: (await import("squiggle-components-0.8.6")).SquigglePlayground,
  })),
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
  // available since 0.8.6
  sourceId?: string;
  renderExtraDropdownItems?: (options: {
    openModal: (name: string) => void;
  }) => ReactNode;
};

// supported only in modern playgrounds
type LinkerProps = {
  linker?: {
    resolve: (name: string, fromId: string) => string;
    loadSource: (sourceId: string) => Promise<string>;
  };
};

type Props = CommonProps &
  LinkerProps & {
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

  return (
    // TODO - fallback spinner / loading message?
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
        // older playgrounds don't support these, it'll be ignored, that's fine
        // (why TypeScript doesn't error on this, these props didn't exist in 0.8.5? no idea)
        linker={props.linker}
        renderExtraDropdownItems={props.renderExtraDropdownItems}
        sourceId={props.sourceId}
      />
    </Suspense>
  );
};
