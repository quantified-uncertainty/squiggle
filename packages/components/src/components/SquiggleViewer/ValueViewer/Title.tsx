import clsx from "clsx";
import compact from "lodash/compact.js";
import { FC, useMemo } from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";
import { CodeBracketIcon } from "@quri/ui";

import { pathToShortName } from "../utils.js";
import { ViewerType } from "../ViewerProvider.js";

type TitleProps = {
  valuePath: SqValuePath;
  parentValue?: SqValue;
  isRootImport: boolean;
  taggedName?: string;
  viewerType: ViewerType;
  headerVisibility: "normal" | "large" | "hide";
  isRoot: boolean;
  zoomIn: (path: SqValuePath) => void;
  exportData?:
    | {
        sourceId: string;
        path: string[];
      }
    | undefined;
};

type StandardProps = {
  title?: string;
  color?: string;
  textSize?: string;
  icon?: JSX.Element;
  hasEdges?: boolean;
  isFocusEnabled?: boolean;
};

const getStandardProps = (props: TitleProps): StandardProps => {
  const {
    valuePath,
    parentValue,
    isRootImport,
    taggedName,
    viewerType,
    headerVisibility,
    isRoot,
    exportData,
  } = props;

  const standardProps = compact([
    viewerType === "tooltip" && { isFocusEnabled: false },
    valuePath.edges.length > 1 && {
      color: "text-teal-700",
      hasEdges: true,
    },
    headerVisibility === "large" && {
      color: "text-stone-700",
      textSize: "text-md font-bold",
      hasEdges: false,
      isFocusEnabled: false,
    },
    isRoot && {
      color: "text-stone-500",
      textSize: "text-sm font-semibold",
      hasEdges: false,
      isFocusEnabled: false,
    },
    parentValue?.tag === "Array" &&
      !taggedName && {
        color: "text-stone-400",
      },
    taggedName && {
      title: taggedName,
    },
    isRootImport && {
      title: exportData?.sourceId || undefined,
      color: "text-violet-900",
      icon: <CodeBracketIcon size={12} className="mr-1 text-violet-900" />,
      hasEdges: false,
    },
  ]);

  return standardProps.reduce((acc, prop) => ({ ...acc, ...prop }), {});
};
export const Title: FC<TitleProps> = (props) => {
  const { valuePath, zoomIn } = props;
  const standards = useMemo(() => getStandardProps(props), [props]);

  const {
    title = pathToShortName(valuePath),
    color = "text-orange-900",
    icon = undefined,
    hasEdges = false,
    isFocusEnabled = true,
    textSize = "text-sm",
  } = standards;

  return (
    <div
      className={clsx(
        "flex flex-row items-center leading-3",
        hasEdges && "mr-3"
      )}
    >
      {icon}
      <div
        className={clsx(
          color,
          textSize,
          "font-mono",
          isFocusEnabled && "cursor-pointer hover:underline"
        )}
        onClick={() => isFocusEnabled && zoomIn(valuePath)}
      >
        {title}
      </div>
    </div>
  );
};
