import { ComponentType, FC } from "react";
import dynamic from "next/dynamic";
import { useAvailableHeight } from "../../utils/useAvailableHeight";

// Imported non-dynamically as a demo of version pinning.
// 0.8.4 had `exports` configuration in its `package.json` which wasn't compatible with Next.js resolutions.
// For this reason, support for 0.8.4 should be removed later (preferably before the PR is merged).
import { SquigglePlayground as Playground084 } from "components-0.8.4";

export const versions = ["0.8.4", "0.8.5-dev"] as const;

export type Version = (typeof versions)[number];

export const defaultVersion: Version = "0.8.4";

type CommonProps = {
  defaultCode?: string;
  distributionChartSettings?: { showSummary?: boolean }; // simplified
  renderExtraControls?: (options: {
    openModal: (name: string) => void;
  }) => React.ReactNode;
  onCodeChange?: (code: string) => void;
  onSettingsChange?: (settings: {
    distributionChartSettings: { showSummary: boolean };
  }) => void;
  height?: string | number;
};

const playgroundByVersion: {
  // checking that all versions are compatible with props that we plan to pass
  [k in Version]: ComponentType<CommonProps>;
} = {
  "0.8.4": Playground084,
  "0.8.5-dev": dynamic(() =>
    import("@quri/squiggle-components").then((mod) => mod.SquigglePlayground)
  ),
};

type Props = Omit<CommonProps, "height"> & { version: Version };

export const VersionedPlayground: FC<Props> = ({ version, ...props }) => {
  const { height, ref } = useAvailableHeight();

  const Playground = playgroundByVersion[version];
  if (!Playground) {
    return <div>Version not found</div>;
  }

  return (
    <div style={{ minHeight: height }} ref={ref}>
      {Playground ? (
        <Playground {...props} height={height} />
      ) : (
        <div>Failed to load playground components for version {version}</div>
      )}
    </div>
  );
};
