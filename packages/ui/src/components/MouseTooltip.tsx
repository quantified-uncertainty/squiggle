"use client";
import { FC, PropsWithChildren, ReactNode, memo, useContext } from "react";

import {
  FloatingPortal,
  offset,
  shift,
  useClientPoint,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { TailwindContext } from "./TailwindProvider.js";

function useMouseTooltip({ isOpen }: { isOpen: boolean }) {
  const floating = useFloating({
    open: isOpen,
    middleware: [offset(4), shift()],
  });

  const floatingClientPoint = useClientPoint(floating.context, {
    enabled: isOpen,
  });

  const floatingInteractions = useInteractions([floatingClientPoint]);

  return {
    containerRef: floating.refs.setReference,
    ref: floating.refs.setFloating,
    styles: {
      position: floating.strategy,
      top: floating.y ?? 0,
      left: floating.x ?? 0,
    },
    containerProps: floatingInteractions.getReferenceProps(),
    props: floatingInteractions.getFloatingProps(),
  };
}

type Props = PropsWithChildren<{
  isOpen: boolean;
  render(): ReactNode;
}>;

export const MouseTooltip: FC<Props> = memo(function MouseTooltip({
  render,
  isOpen,
  children,
}: Props) {
  const tooltip = useMouseTooltip({ isOpen });

  const { selector: tailwindSelector } = useContext(TailwindContext);

  return (
    <div ref={tooltip.containerRef} {...tooltip.containerProps}>
      {children}
      {isOpen && (
        <FloatingPortal>
          <div ref={tooltip.ref} style={tooltip.styles} {...tooltip.props}>
            <div className={tailwindSelector}>{render()}</div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
});
