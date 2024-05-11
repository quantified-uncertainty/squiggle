import { FC, forwardRef, memo } from "react";

import { SqValue } from "@quri/squiggle-lang";

import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { MessageAlert } from "../ui/Alert.js";
import { ErrorBoundary } from "../ui/ErrorBoundary.js";
import { useGetSubvalueByPath } from "./utils.js";
import { ValueViewer } from "./ValueViewer/index.js";
import {
  SquiggleViewerHandle,
  useExternalActionsForEditor,
  useViewerContext,
  ViewerProvider,
} from "./ViewerProvider.js";
import { ZoomedInNavigation } from "./ZoomedInNavigation.js";

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
    const externalActions = useExternalActionsForEditor(editor);
    return (
      <ErrorBoundary>
        <ViewerProvider
          partialPlaygroundSettings={partialPlaygroundSettings}
          externalActions={externalActions}
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
