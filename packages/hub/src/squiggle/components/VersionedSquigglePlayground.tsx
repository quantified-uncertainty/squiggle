import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";
import dynamic from "next/dynamic";
import { FC, ReactNode } from "react";

// Imported non-dynamically as a demo of version pinning.
// 0.8.4 had `exports` configuration in its `package.json` which wasn't compatible with Next.js resolutions.
// For this reason, support for 0.8.4 should be removed later (preferably before the PR is merged).
import { SquigglePlayground as Playground084 } from "squiggle-components-0.8.4";

export const versions = ["0.8.4", "0.8.5-dev"] as const;

export type Version = (typeof versions)[number];

export const defaultVersion: Version = "0.8.4";

// Note: typing this with `{ [k in Version]: ComponentType<CommonProps> }` won't work because of contravariance issues.
// Instead, we pass all props explicitly to the playground component when it's instantiated to check that all props are compatible.
const playgroundByVersion = {
  "0.8.4": Playground084,
  "0.8.5-dev": dynamic(() =>
    import("@quri/squiggle-components").then((mod) => mod.SquigglePlayground)
  ),
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

type Props = CommonProps & { version: Version };

export const PlaygroundVersionPicker: FC<{
  version: Version;
  onChange: (newVersion: Version) => void;
}> = ({ version, onChange }) => {
  return (
    <div className="flex gap-2 items-center">
      <Dropdown
        render={({ close }) => (
          <DropdownMenu>
            {versions.map((version) => (
              <DropdownMenuActionItem
                key={version}
                title={version}
                onClick={() => {
                  onChange(version);
                  close();
                }}
              />
            ))}
          </DropdownMenu>
        )}
      >
        <Button size="small">{version}</Button>
      </Dropdown>
    </div>
  );
};

export const VersionedSquigglePlayground: FC<Props> = ({
  version,
  ...props
}) => {
  const Playground = playgroundByVersion[version];
  if (!Playground) {
    return <div>Version not found</div>;
  }

  return Playground ? (
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
  ) : (
    <div>Failed to load playground components for version {version}</div>
  );
};
