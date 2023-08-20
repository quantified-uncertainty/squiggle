import { ComponentType, FC } from "react";
import dynamic from "next/dynamic";
import { useAvailableHeight } from "../../utils/useAvailableHeight";

export const versions = ["0.8.4", "latest"] as const;

export type Version = (typeof versions)[number];

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

const PlaygroundLatest = dynamic(() =>
  import("@quri/squiggle-components").then((mod) => mod.SquigglePlayground)
);

const Playground084 = dynamic(() =>
  import("components-0.8.4").then((mod) => mod.SquigglePlayground)
);

const playgroundByVersion: {
  // checking that all versions are compatible with props that we plan to pass
  [k in Version]: ComponentType<CommonProps>;
} = {
  "0.8.4": Playground084,
  latest: PlaygroundLatest,
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
