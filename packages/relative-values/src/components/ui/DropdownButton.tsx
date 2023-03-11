import {
  arrow,
  flip,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import clsx from "clsx";
import { FC, useRef, useState } from "react";

import { Button } from "./Button";

type Props = {
  text: string;
  children: () => React.ReactNode;
};

export const DropdownButton: FC<Props> = ({ text, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef<HTMLDivElement | null>(null);

  const { x, y, strategy, placement, refs, middlewareData, context } =
    useFloating({
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: "bottom-start",
      middleware: [offset(4), flip(), arrow({ element: arrowRef })],
    });

  const click = useClick(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const staticSide = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[placement.split("-")[0]];

  const renderTooltip = () => (
    <div
      ref={refs.setFloating}
      className={clsx(
        "z-10 rounded-sm px-3 py-2 bg-white shadow-dropdown",
        text !== undefined && "text-sm"
      )}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
      }}
      {...getFloatingProps()}
    >
      {children()}
      <div
        ref={arrowRef}
        style={{
          left: middlewareData.arrow?.x ?? "",
          top: middlewareData.arrow?.y ?? "",
          [staticSide!]: "-0.25rem",
        }}
        className={clsx("absolute h-2 w-2 rotate-45 bg-white")}
      />
    </div>
  );

  return (
    <>
      <Button ref={refs.setReference} {...getReferenceProps()}>
        {text}
      </Button>
      {isOpen ? renderTooltip() : null}
    </>
  );
};
