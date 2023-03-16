import {
  arrow,
  flip,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import clsx from "clsx";
import { FC, useRef, useState } from "react";
import { Tailwind } from "../Tailwind";

type Props = {
  render(options: { close(): void }): React.ReactNode;
  fullHeight?: boolean;
  children: React.ReactNode;
};

export const Dropdown: FC<Props> = ({ render, fullHeight, children }) => {
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
    <FloatingPortal>
      <Tailwind>
        <div
          ref={refs.setFloating}
          className="z-50 rounded-sm bg-white shadow-dropdown"
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
          }}
          {...getFloatingProps()}
        >
          {render({ close: () => setIsOpen(false) })}
          <div
            ref={arrowRef}
            style={{
              left: middlewareData.arrow?.x ?? "",
              top: middlewareData.arrow?.y ?? "",
              [staticSide!]: "-0.25rem",
            }}
            className="absolute h-2 w-2 rotate-45 bg-white"
          />
        </div>
      </Tailwind>
    </FloatingPortal>
  );

  return (
    <>
      <div
        className={clsx(fullHeight && "h-full grid place-items-stretch")}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {children}
      </div>
      {isOpen ? renderTooltip() : null}
    </>
  );
};
