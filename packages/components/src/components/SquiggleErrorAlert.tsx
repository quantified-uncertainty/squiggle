import { FC, PropsWithChildren } from "react";

import {
  SqCompileError,
  SqError,
  SqFrame,
  SqRuntimeError,
} from "@quri/squiggle-lang";

import { ErrorAlert } from "./Alert.js";
import { useViewerContext } from "./SquiggleViewer/ViewerProvider.js";
import { CodeBracketIcon, LinkIcon } from "@quri/ui";

type Props = {
  error: SqError;
};

const LocationLine: FC<{
  location: NonNullable<ReturnType<SqFrame["location"]>>;
}> = ({ location }) => {
  const { editor } = useViewerContext();

  const findInEditor = () => {
    editor?.scrollTo(location.start.offset);
  };

  return (
    <div style={{ display: "inline-block" }}>
      <span
        className="text-red-800 cursor-pointer items-center flex border-b border-red-900 border-opacity-50 hover:bg-red-200 leading-4"
        onClick={findInEditor}
      >
        <CodeBracketIcon size={14} className="mr-1" />
        line {location.start.line}, column {location.start.column}
      </span>
    </div>
  );
};

const WithHeader: FC<PropsWithChildren<{ header: string }>> = ({
  header,
  children,
}) => (
  <div>
    <div className="font-medium">{header}</div>
    <div className="ml-4">{children}</div>
  </div>
);

const StackTraceFrame: FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  return (
    <div className="text-sm font-mono">
      {frame.name()} {location && <LocationLine location={location} />}
    </div>
  );
};

const StackTrace: FC<{ error: SqRuntimeError }> = ({ error }) => {
  const frames = error.getFrameArray();
  return frames.length ? (
    <WithHeader header="Stack trace:">
      {frames.map((frame, i) => (
        <StackTraceFrame frame={frame} key={i} />
      ))}
    </WithHeader>
  ) : null;
};

export const SquiggleErrorAlert: FC<Props> = ({ error }) => {
  return (
    <ErrorAlert heading="Error">
      <div className="space-y-4">
        <div className="whitespace-pre-wrap">{error.toString()}</div>
        {error instanceof SqRuntimeError ? (
          <StackTrace error={error} />
        ) : error instanceof SqCompileError ? (
          <LocationLine location={error.location()} />
        ) : null}
      </div>
    </ErrorAlert>
  );
};
