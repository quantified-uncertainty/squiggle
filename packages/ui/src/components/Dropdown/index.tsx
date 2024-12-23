"use client";
import {
  arrow,
  flip,
  FloatingPortal,
  offset,
  Placement,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { clsx } from "clsx";
import {
  FC,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { TailwindContext } from "../TailwindProvider.js";
import { DropdownContext } from "./DropdownContext.js";

type Props = PropsWithChildren<{
  // `close` option is for backward compatibility; new code should use `useCloseDropdown` instead.
  render(options: { close(): void }): ReactNode;
  // In some cases, you want the dropdown to fill its container;
  // since dropdowns put its children in an extra div, this option might be necessary.
  fullHeight?: boolean;
  placement?: Placement;
}>;

export const Dropdown: FC<Props> = ({
  render,
  fullHeight,
  placement: suggestedPlacement = "bottom-start",
  children,
}) => {
  const { selector: tailwindSelector } = useContext(TailwindContext);

  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef<HTMLDivElement | null>(null);

  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: suggestedPlacement,
    middleware: [offset(4), flip(), arrow({ element: arrowRef })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const renderTooltip = () => (
    <FloatingPortal>
      <div className={tailwindSelector}>
        <div
          ref={refs.setFloating}
          className="z-30 overflow-hidden rounded-md border border-slate-300 bg-white shadow-xl"
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
          }}
          {...getFloatingProps()}
        >
          {render({ close: closeDropdown })}
        </div>
      </div>
    </FloatingPortal>
  );

  return (
    <DropdownContext.Provider value={{ closeDropdown }}>
      <div
        className={clsx(fullHeight && "grid h-full place-items-stretch")}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {children}
      </div>
      {isOpen ? renderTooltip() : null}
    </DropdownContext.Provider>
  );
};
