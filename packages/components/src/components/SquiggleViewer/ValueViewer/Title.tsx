import { clsx } from "clsx";
import { FC } from "react";

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

export const Title: FC<TitleProps> = ({
  valuePath,
  parentValue,
  isRootImport,
  taggedName,
  viewerType,
  headerVisibility,
  isRoot,
  zoomIn,
  exportData,
}) => {
  const title: string =
    (isRootImport && exportData?.sourceId) ||
    taggedName ||
    pathToShortName(valuePath);

  const disableFocus: boolean =
    headerVisibility === "large" || isRoot || viewerType === "tooltip";

  // We want to show colons after the keys, for dicts/arrays.
  const hideColon: boolean =
    headerVisibility === "large" || isRoot || isRootImport;

  const color = (): string => {
    const parentTag: string | undefined = parentValue?.tag;
    if (isRootImport) return "text-violet-900";
    if (headerVisibility === "large") return "text-stone-800";
    if (isRoot) return "text-stone-500";
    if (parentTag === "Array" && !taggedName) return "text-stone-400";
    return "text-orange-900";
  };

  const textSize = (): string => {
    if (headerVisibility === "large") {
      return "text-md font-bold";
    } else if (isRoot) {
      return "text-sm font-semibold";
    } else {
      return `text-sm`;
    }
  };

  const focusClasses = disableFocus ? "" : "cursor-pointer hover:underline";

  const headerClasses = (): string => {
    return clsx(color(), textSize(), focusClasses);
  };

  return (
    <div
      className={`leading-3 flex flex-row items-center ${!hideColon || "mr-3"}`}
    >
      {isRootImport && (
        <CodeBracketIcon size={12} className="mr-1 text-violet-900" />
      )}
      <div
        className={clsx(!taggedName && "font-mono", headerClasses())}
        onClick={() => !disableFocus && zoomIn(valuePath)}
      >
        {title}
      </div>
      {!hideColon && <div className="text-gray-400 font-mono">:</div>}
    </div>
  );
};
