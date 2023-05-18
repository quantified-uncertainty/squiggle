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
import { clsx } from "clsx";
import { FC, PropsWithChildren, useRef, useState } from "react";

type Props = PropsWithChildren<{
  render(options: { close(): void }): React.ReactNode;
  fullHeight?: boolean;
  // When `important: '.container-classname'` is used, this should be set because we render dropdowns in a portal.
  // `squiggle-components` set this to `squiggle`.
  // See also: https://tailwindcss.com/docs/configuration#selector-strategy
  tailwindSelector?: string;
}>;

export const Dropdown: FC<Props> = ({
  render,
  fullHeight,
  tailwindSelector,
  children,
}) => {
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
      <div className={tailwindSelector}>
        <div
          ref={refs.setFloating}
          className="z-50 rounded-sm bg-white shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
          }}
          {...getFloatingProps()}
        >
          {render({ close: () => setIsOpen(false) })}
          {
            // arrow is disabled for now - has rendering issues
            false && (
              <div
                ref={arrowRef}
                style={{
                  left: middlewareData.arrow?.x ?? "",
                  top: middlewareData.arrow?.y ?? "",
                  [staticSide!]: "-0.25rem",
                }}
                className="absolute h-2 w-2 rotate-45 bg-white"
              />
            )
          }
        </div>
      </div>
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
