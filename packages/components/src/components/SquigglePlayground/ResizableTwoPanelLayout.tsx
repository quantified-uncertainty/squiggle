import { clsx } from "clsx";
import { CSSProperties, FC, ReactNode } from "react";
import { ResizableBox } from "react-resizable";
import { useInitialWidth } from "../../lib/hooks/index.js";

type Props = {
  renderLeft(): ReactNode;
  renderRight(): ReactNode;
  height?: CSSProperties["height"];
};

export const ResizableTwoPanelLayout: FC<Props> = ({
  renderLeft,
  renderRight,
  height,
}) => {
  const { ref: fullContainerRef, width: initialWidth } = useInitialWidth();

  return (
    <div
      className="flex items-stretch"
      ref={fullContainerRef}
      style={{ height }}
    >
      <ResizableBox
        className={clsx("relative", !initialWidth && "w-1/2")}
        width={
          /* We intentionally pass the invalid value to ResizableBox when initialWidth is not set yet.
           * This causes warnings in development.
           * See also: https://github.com/quantified-uncertainty/squiggle/issues/1934
           */
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialWidth === undefined ? (null as any) : initialWidth / 2
        }
        axis="x"
        resizeHandles={["e"]}
        handle={(_, ref) => (
          <div
            ref={ref}
            // we don't use react-resizable original styles, it's easier to style this manually
            className="absolute top-0 h-full border-l border-slate-300 hover:border-blue-500 transition cursor-ew-resize"
            style={{ width: 5, right: -5 }}
          />
        )}
      >
        {renderLeft()}
      </ResizableBox>
      <div className="flex-1 flex flex-col overflow-y-auto">
        {renderRight()}
      </div>
    </div>
  );
};
