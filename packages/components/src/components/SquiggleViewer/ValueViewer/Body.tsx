import { clsx } from "clsx";
import { FC, PropsWithChildren, useMemo } from "react";

import { MarkdownViewer } from "../../../lib/MarkdownViewer.js";
import { SqValueWithContext } from "../../../lib/utility.js";
import { SquiggleValueChart } from "../SquiggleValueChart.js";
import { getValueComment } from "../utils.js";
import { useMergedSettings } from "../ViewerProvider.js";

type WithCommentProps = {
  value: SqValueWithContext;
};

const WithComment: FC<PropsWithChildren<WithCommentProps>> = ({
  value,
  children,
}) => {
  const comment = getValueComment(value);

  if (!comment) {
    return children;
  }

  const tagsWithTopPosition = new Set([
    "Dict",
    "Array",
    "TableChart",
    "Plot",
    "String",
  ]);
  const commentPosition = tagsWithTopPosition.has(value.tag) ? "top" : "bottom";

  const commentEl = (
    <div
      className={clsx(
        "max-w-4xl",
        commentPosition === "bottom" ? "mt-1" : "mb-1"
      )}
    >
      <MarkdownViewer md={comment} textSize="sm" />
    </div>
  );

  return (
    // TODO - can be simplified with flex-col-reverse
    <div>
      {commentPosition === "top" && commentEl}
      {children}
      {commentPosition === "bottom" && commentEl}
    </div>
  );
};

type BodyProps = {
  value: SqValueWithContext;
  size?: "normal" | "large";
};

export const Body: FC<BodyProps> = ({ value, size = "normal" }) => {
  const { path } = value.context;
  const mergedSettings = useMergedSettings(path);
  const adjustedMergedSettings = useMemo(() => {
    const { chartHeight } = mergedSettings;
    return {
      ...mergedSettings,
      chartHeight: size === "large" ? chartHeight * 4 : chartHeight,
    };
  }, [size, mergedSettings]);

  return (
    <WithComment value={value}>
      <SquiggleValueChart value={value} settings={adjustedMergedSettings} />
    </WithComment>
  );
};
