import { FC, memo } from "react";

import { SqValue } from "@quri/squiggle-lang";
import { FocusIcon, ChevronRightIcon } from "@quri/ui";
import { useSquiggle } from "../../lib/hooks/index.js";
import { PartialPlaygroundSettings } from "../PlaygroundSettings.js";
import { SquiggleErrorAlert } from "../SquiggleErrorAlert.js";
import { ExpressionViewer } from "./ExpressionViewer.js";
import {
  ViewerProvider,
  useFocus,
  useUnfocus,
  useViewerContext,
} from "./ViewerProvider.js";
import { extractSubvalueByLocation, locationAsString } from "./utils.js";
import { MessageAlert } from "../Alert.js";

type Result = ReturnType<typeof useSquiggle>["result"];

export type SquiggleViewerProps = {
  /** The output of squiggle's run */
  result: Result;
  localSettingsEnabled?: boolean;
} & PartialPlaygroundSettings;

type BodyProps = Pick<SquiggleViewerProps, "result">;

const SquiggleViewerBody: FC<{ value: SqValue }> = ({ value }) => {
  const { focused } = useViewerContext();

  const valueToRender = focused
    ? extractSubvalueByLocation(value, focused)
    : value;

  if (!valueToRender) {
    return <MessageAlert heading="Focused variable is not defined" />;
  }

  return <ExpressionViewer value={valueToRender} />;
};

const SquiggleViewerOuter: FC<BodyProps> = ({ result }) => {
  const { focused } = useViewerContext();
  const unfocus = useUnfocus();
  const focus = useFocus();

  const navLinkStyle =
    "text-sm text-slate-500 hover:text-slate-900 hover:underline font-mono cursor-pointer";

  const focusedNavigation = focused && (
    <div className="flex items-center mb-3 pl-1">
      <span onClick={unfocus} className={navLinkStyle}>
        {focused.path.root === "bindings" ? "Variables" : focused.path.root}
      </span>
      {focused
        .pathItemsAsValueLocations()
        .slice(0, -1)
        .map((location, i) => (
          <div key={i} className="flex items-center">
            <ChevronRightIcon className="text-slate-300" size={24} />
            <div onClick={() => focus(location)} className={navLinkStyle}>
              {location.path.items[i]}
            </div>
          </div>
        ))}
    </div>
  );

  return (
    <div>
      {focusedNavigation}
      {result.ok ? (
        <SquiggleViewerBody value={result.value} />
      ) : (
        <SquiggleErrorAlert error={result.value} />
      )}
    </div>
  );
};

export const SquiggleViewer = memo<SquiggleViewerProps>(
  function SquiggleViewer({
    result,
    localSettingsEnabled = false,
    ...partialPlaygroundSettings
  }) {
    return (
      <ViewerProvider
        partialPlaygroundSettings={partialPlaygroundSettings}
        localSettingsEnabled={localSettingsEnabled}
      >
        <SquiggleViewerOuter result={result} />
      </ViewerProvider>
    );
  }
);
