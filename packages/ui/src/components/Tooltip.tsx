"use client";
import {
  flip,
  FloatingPortal,
  offset,
  Placement,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { cloneElement, FC, ReactNode, useState } from "react";

type Props = {
  render: () => ReactNode;
  children: JSX.Element;
  placement?: Placement;
  offset?: number;
};

export const Tooltip: FC<Props> = ({
  render,
  placement,
  offset: offsetAmount,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { x, y, refs, strategy, context } = useFloating({
    placement: placement ?? "top",
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [shift(), offset(offsetAmount ?? 2), flip()],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { delay: 50 }),
    useRole(context, { role: "tooltip" }),
    useDismiss(context),
  ]);

  return (
    <>
      {cloneElement(
        children,
        getReferenceProps({ ref: refs.setReference, ...children.props })
      )}
      <AnimatePresence>
        {isOpen && (
          <FloatingPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.07 }}
              {...getFloatingProps({
                ref: refs.setFloating,
                className: "z-10",
                style: {
                  position: strategy,
                  top: y ?? 0,
                  left: x ?? 0,
                },
              })}
            >
              {render()}
            </motion.div>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </>
  );
};
