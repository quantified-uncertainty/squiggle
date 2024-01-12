import { FC, forwardRef, memo } from "react";

import { SqValue, SqValuePath } from "@quri/squiggle-lang";
import { ChevronRightIcon } from "@quri/ui";

import { MessageAlert } from "../Alert.js";
import { CodeEditorHandle } from "../CodeEditor/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { pathIsEqual, pathItemFormat, useGetSubvalueByPath } from "./utils.js";
import { ValueViewer } from "./ValueViewer.js";
import {
  useFocus,
  useUnfocus,
  useViewerContext,
  ViewerProvider,
} from "./ViewerProvider.js";

const FocusedNavigationItem: FC<{
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

const FocusedNavigation: FC<{
  focusedPath: SqValuePath;
  rootPath?: SqValuePath | undefined;
}> = ({ focusedPath, rootPath }) => {
  const unfocus = useUnfocus();
  const focus = useFocus();

  const isFocusedOnRootPath = rootPath && pathIsEqual(focusedPath, rootPath);

  if (isFocusedOnRootPath) {
    return null;
  }

  // If we're focused on the root path override, we need to adjust the focused path accordingly when presenting the navigation, so that it begins with the root path intead. This is a bit confusing.
  const rootPathFocusedAdjustment = rootPath?.items.length
    ? rootPath.items.length - 1
    : 0;

  return (
    <div className="flex items-center mb-3 pl-3">
      {!rootPath?.items.length && (
        <FocusedNavigationItem onClick={unfocus} text="Home" />
      )}

      {focusedPath
        .itemsAsValuePaths({ includeRoot: false })
        .slice(rootPathFocusedAdjustment, -1)
        .map((path, i) => (
          <FocusedNavigationItem
            key={i}
            onClick={() => focus(path)}
            text={pathItemFormat(path.items[i + rootPathFocusedAdjustment])}
          />
        ))}
    </div>
  );
};

export type SquiggleViewerHandle = {
  viewValuePath(path: SqValuePath): void;
};

export type SquiggleViewerProps = {
  value: SqValue;
  editor?: CodeEditorHandle;
} & PartialPlaygroundSettings;

const SquiggleViewerWithoutProvider: FC<SquiggleViewerProps> = ({ value }) => {
  const { focused } = useViewerContext();

  const getSubvalueByPath = useGetSubvalueByPath();

  let focusedItem: SqValue | undefined;
  if (focused) {
    focusedItem = getSubvalueByPath(value, focused);
  }

  const body = () => {
    if (focused) {
      if (focusedItem) {
        return (
          <div className="px-2">
            <ValueViewer
              value={focusedItem}
              collapsible={false}
              header="large"
              size="large"
            />
          </div>
        );
      } else {
        return <MessageAlert heading="Focused variable is not defined" />;
      }
    } else {
      return <ValueViewer value={value} size="large" />;
    }
  };

  return (
    <div>
      {focused && (
        <FocusedNavigation
          focusedPath={focused}
          rootPath={value.context?.path}
        />
      )}
      {body()}
    </div>
  );
};

const component = forwardRef<SquiggleViewerHandle, SquiggleViewerProps>(
  function SquiggleViewer(
    { value, editor, ...partialPlaygroundSettings },
    ref
  ) {
    return (
      <ViewerProvider
        partialPlaygroundSettings={partialPlaygroundSettings}
        editor={editor}
        ref={ref}
      >
        <SquiggleViewerWithoutProvider value={value} />
      </ViewerProvider>
    );
  }
);
component.displayName = "SquiggleViewer";

// React.memo and React.forwardRef are hard to combine in TypeScript;
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087#issuecomment-656596623
export const SquiggleViewer = memo(component) as typeof component;
