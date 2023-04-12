import * as React from "react";

import {
  offset,
  shift,
  useClientPoint,
  useFloating,
  useInteractions,
} from "@floating-ui/react";

import { FloatingPortal } from "@floating-ui/react";
import { FC, PropsWithChildren, ReactNode, memo } from "react";

function useMouseTooltip({ isOpen }: { isOpen: boolean }) {
  const floating = useFloating({
    open: isOpen,
    middleware: [offset(4), shift()],
  });

  const floatingClientPoint = useClientPoint(floating.context);

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
}) {
  const tooltip = useMouseTooltip({
    isOpen,
  });

  return (
    <div ref={tooltip.containerRef} {...tooltip.containerProps}>
      {children}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={tooltip.ref}
            style={tooltip.styles}
            className="squiggle"
            {...tooltip.props}
          >
            {render()}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
});
