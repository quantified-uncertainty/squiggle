import React, { cloneElement, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react-dom-interactions";

interface Props {
  text: string;
  children: JSX.Element;
}

export const Tooltip: React.FC<Props> = ({ text, children }) => {
  const [open, setOpen] = useState(false);

  const { x, y, reference, floating, strategy, context } = useFloating({
    placement: "top",
    open,
    onOpenChange: setOpen,
    middleware: [shift()],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context),
    useRole(context, { role: "tooltip" }),
    useDismiss(context),
  ]);

  return (
    <>
      {cloneElement(
        children,
        getReferenceProps({ ref: reference, ...children.props })
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            {...getFloatingProps({
              ref: floating,
              className:
                "text-xs p-2 border border-gray-300 rounded bg-white z-10",
              style: {
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
              },
            })}
          >
            <pre>{text}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
