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

  const isFocusEnabled: boolean = !(
    headerVisibility === "large" ||
    isRoot ||
    viewerType === "tooltip"
  );

  // We want to show colons after the keys, for dicts/arrays.
  const shouldShowColon: boolean = !(
    headerVisibility === "large" ||
    isRoot ||
    isRootImport
  );

  const getColor = (): string => {
    const parentTag: string | undefined = parentValue?.tag;
    switch (true) {
      case isRootImport:
        return "text-violet-900";
      case headerVisibility === "large":
        return "text-stone-700";
      case isRoot:
        return "text-stone-500";
      case parentTag === "Array" && !taggedName:
        return "text-stone-400";
      default:
        return "text-orange-900";
    }
  };

  const getTextSize = (): string => {
    if (headerVisibility === "large") {
      return "text-md font-bold";
    } else if (isRoot) {
      return "text-sm font-semibold";
    } else {
      return `text-sm`;
    }
  };

  const getFocusClasses = (): string =>
    isFocusEnabled ? "cursor-pointer hover:underline" : "";

  const headerClasses = clsx(getColor(), getTextSize(), getFocusClasses());

  return (
    <div
      className={clsx(
        "leading-3 flex flex-row items-center",
        shouldShowColon && "mr-3"
      )}
    >
      {isRootImport && (
        <CodeBracketIcon size={12} className="mr-1 text-violet-900" />
      )}
      <div
        className={clsx(!taggedName && "font-mono", headerClasses)}
        onClick={() => isFocusEnabled && zoomIn(valuePath)}
      >
        {title}
      </div>
      {shouldShowColon && <div className="text-gray-400 font-mono">:</div>}
    </div>
  );
};
