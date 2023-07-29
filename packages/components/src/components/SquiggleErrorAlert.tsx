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
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import * as style from "react-syntax-highlighter/dist/esm/styles/prism";
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
    <div className="inline-block">
      <span
        className="text-xs text-blue-500 cursor-pointer items-center flex border-b border-blue-700 border-opacity-50 hover:bg-red-200 leading-4"
        onClick={findInEditor}
      >
        <CodeBracketIcon size={14} className="mr-1" />
        line {location.start.line}, column {location.start.column}
      </span>
    </div>
  );
};
console.log(style, "STLYYE");

const WithHeader: FC<PropsWithChildren<{ header: string }>> = ({
  header,
  children,
}) => (
  <div>
    <div className="font-normal text-red-700">{header}</div>
    <div className="mt-1 ml-1 pl-2 border-l border-red-900 border-opacity-10">
      {children}
    </div>
  </div>
);

const StackTraceFrame: FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  const name = frame.name();
  return (
    <div className="text-sm font-mono flex items-center space-x-2 text-stone-600">
      {name !== "" && <div>{name}</div>}{" "}
      {location && <LocationLine location={location} />}
    </div>
  );
};

const StackTrace: FC<{ error: SqRuntimeError }> = ({ error }) => {
  const frames = error.getFrameArray();
  return frames.length ? (
    <WithHeader header="Stack Trace">
      {frames.map((frame, i) => (
        <StackTraceFrame frame={frame} key={i} />
      ))}
    </WithHeader>
  ) : null;
};

export const SquiggleErrorAlert: FC<Props> = ({ error }) => {
  const errorType = error.toTypeString();
  const [primary, ...rest] = errorType;
  return (
    <div className="text-sm bg-red-50 px-3 py-2 rounded-sm">
      <div className="flex justify-between mb-4">
        <div className="text-red-800 font-bold text-md">{`${primary} Error`}</div>
        <div className="text-red-900">{rest.join(" - ")}</div>
      </div>
      <div className="space-y-6">
        <div>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    language={match[1]}
                    PreTag="div"
                    style={style["oneDark"]}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code {...props} className={className}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {error.toString()}
          </ReactMarkdown>
        </div>

        {error instanceof SqRuntimeError ? (
          <div>
            <StackTrace error={error} />
          </div>
        ) : error instanceof SqCompileError ? (
          <div>
            <LocationLine location={error.location()} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
