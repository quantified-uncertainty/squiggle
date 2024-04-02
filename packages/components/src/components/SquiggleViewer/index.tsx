import { FC, forwardRef, memo } from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";
import { ChevronRightIcon } from "@quri/ui";

import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { MessageAlert } from "../ui/Alert.js";
import { ErrorBoundary } from "../ui/ErrorBoundary.js";
import { useGetSubvalueByPath } from "./utils.js";
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
  visibleRootPath?: SqValuePath | undefined;
}> = ({ zoomedInPath, visibleRootPath }) => {
  const zoomOut = useZoomOut();
  const zoomIn = useZoomIn();

  const paths = visibleRootPath
    ? zoomedInPath
        .allPrefixPaths()
        .difference(visibleRootPath.allPrefixPaths())
        .withoutRoot().paths
    : zoomedInPath.allPrefixPaths().withoutRoot().paths;

  return (
    <div className="flex items-center">
      <ZoomedInNavigationItem onClick={zoomOut} text="Home" />

      {paths.slice(0, -1).map((path, i) => (
        <ZoomedInNavigationItem
          key={i}
          onClick={() => zoomIn(path)}
          text={path.lastItem()?.toDisplayString() || ""}
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
  const { zoomedInPath, visibleRootPath } = useViewerContext();

  const getSubvalueByPath = useGetSubvalueByPath();

  if (zoomedInPath) {
    const zoomedInItem = getSubvalueByPath(zoomedInPath);
    return (
      <div className="space-y-3 pl-3">
        <ZoomedInNavigation
          zoomedInPath={zoomedInPath}
          visibleRootPath={visibleRootPath}
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
    );
  } else if (visibleRootPath) {
    const visibleValue = getSubvalueByPath(visibleRootPath);
    return visibleValue ? (
      <ValueViewer
        value={visibleValue}
        size="large"
        header="large"
        collapsible={false}
      />
    ) : null;
  } else {
    return <ValueViewer value={value} size="large" />;
  }
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
