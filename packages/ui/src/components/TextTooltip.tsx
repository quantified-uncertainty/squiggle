import { FC, cloneElement, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  flip,
  shift,
  offset,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";

type Props = {
  text: string;
  children: JSX.Element;
};

export const TextTooltip: FC<Props> = ({ text, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { x, y, refs, strategy, context } = useFloating({
    placement: "top", // TODO - make configurable
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [shift(), offset(2), flip()],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { delay: 300 }),
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            {...getFloatingProps({
              ref: refs.setFloating,
              className:
                "text-xs p-2 border border-gray-300 rounded bg-white z-10",
              style: {
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
              },
            })}
          >
            <div className="font-mono whitespace-pre">{text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
