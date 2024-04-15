import { FC } from "react";

import { SqValuePath } from "@quri/squiggle-lang";
import { ChevronRightIcon } from "@quri/ui";

import { useZoomIn, useZoomOut } from "./ViewerProvider.js";

export const ZoomedInNavigationItem: FC<{
  text: string;
  onClick: () => void;
}> = ({ text, onClick }) => (
  <div className="flex items-center">
    <span
      onClick={onClick}
      className="text-sm text-stone-500 hover:text-stone-900 hover:underline font-mono cursor-pointer"
    >
      {text}
    </span>
    <ChevronRightIcon className="text-slate-300" size={24} />
  </div>
);

export const ZoomedInNavigation: FC<{
  zoomedInPath: SqValuePath;
  visibleRootPath?: SqValuePath | undefined;
}> = ({ zoomedInPath, visibleRootPath }) => {
  const zoomOut = useZoomOut();
  const zoomIn = useZoomIn();

  const paths = visibleRootPath
    ? zoomedInPath.allPrefixPaths().difference(visibleRootPath.allPrefixPaths())
    : zoomedInPath.allPrefixPaths();

  return (
    <div className="flex items-center">
      <ZoomedInNavigationItem onClick={zoomOut} text="Home" />

      {/* We remove the last element, because it's the one being shown  */}
      {paths
        .withoutRoot()
        .paths.slice(0, -1)
        .map((path, i) => (
          <ZoomedInNavigationItem
            key={i}
            onClick={() => zoomIn(path)}
            text={path.lastItem()?.toDisplayString() || ""}
          />
        ))}
    </div>
  );
};
