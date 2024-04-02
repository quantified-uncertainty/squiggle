import { FC, forwardRef, memo } from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";
import { ChevronRightIcon } from "@quri/ui";

import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { MessageAlert } from "../ui/Alert.js";
import { ErrorBoundary } from "../ui/ErrorBoundary.js";
import { useGetRootSubvalueByPath } from "./utils.js";
import { ValueViewer } from "./ValueViewer.js";
import {
  SquiggleViewerHandle,
  useViewerContext,
  useZoomIn,
  useZoomOut,
  ViewerProvider,
} from "./ViewerProvider.js";

const ZoomedInNavigationItem: FC<{
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

const ZoomedInNavigation: FC<{
  zoomedInPath: SqValuePath;
  rootPath?: SqValuePath | undefined;
}> = ({ zoomedInPath, rootPath }) => {
  const zoomOut = useZoomOut();
  const zoomIn = useZoomIn();

  const isZoomedInOnRootPath = rootPath && rootPath.isEqual(zoomedInPath);

  if (isZoomedInOnRootPath) {
    return null;
  }

  // If we're zoomedIn on the root path override, we need to adjust the zoomedIn path accordingly when presenting the navigation, so that it begins with the root path intead. This is a bit confusing.
  const rootPathZoomedInAdjustment = rootPath?.edges.length
    ? rootPath.edges.length - 1
    : 0;

  //TODO: Change to use Path logic
  return (
    <div className="flex items-center">
      {!rootPath?.edges.length && (
        <ZoomedInNavigationItem onClick={zoomOut} text="Home" />
      )}

      {zoomedInPath
        .allPrefixPaths({ includeRoot: false })
        .slice(rootPathZoomedInAdjustment, -1)
        .map((path, i) => (
          <ZoomedInNavigationItem
            key={i}
            onClick={() => zoomIn(path)}
            text={path.edges[i + rootPathZoomedInAdjustment].toDisplayString()}
          />
        ))}
    </div>
  );
};

export type SquiggleViewerProps = {
  value: SqValue;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

//This needs to be inside the ViewerProvider. This is why it's separated from the component.
export const SquiggleViewerWithoutProvider: FC<
  Omit<SquiggleViewerProps, "sourceId" | "sqOutput">
> = ({ value }) => {
  const { zoomedInPath } = useViewerContext();

  const getRootSubvalueByPath = useGetRootSubvalueByPath();

  let zoomedInItem: SqValue | undefined;
  if (zoomedInPath) {
    zoomedInItem = getRootSubvalueByPath(zoomedInPath);
  }

  return zoomedInPath ? (
    <div className="space-y-3 pl-3">
      <ZoomedInNavigation
        zoomedInPath={zoomedInPath}
        rootPath={value.context?.path}
      />
      {zoomedInItem ? (
        <ValueViewer
          value={zoomedInItem}
          collapsible={false}
          header="large"
          size="large"
        />
      ) : (
        <MessageAlert heading="ZoomedIn variable is not defined" />
      )}
    </div>
  ) : (
    <ValueViewer value={value} size="large" />
  );
};

const component = forwardRef<SquiggleViewerHandle, SquiggleViewerProps>(
  function SquiggleViewer(
    { value, editor, ...partialPlaygroundSettings },
    ref
  ) {
    return (
      <ErrorBoundary>
        <ViewerProvider
          partialPlaygroundSettings={partialPlaygroundSettings}
          editor={editor}
          ref={ref}
          rootValue={value}
        >
          <SquiggleViewerWithoutProvider value={value} />
        </ViewerProvider>
      </ErrorBoundary>
    );
  }
);
component.displayName = "SquiggleViewer";

// React.memo and React.forwardRef are hard to combine in TypeScript;
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087#issuecomment-656596623
export const SquiggleViewer = memo(component) as typeof component;
