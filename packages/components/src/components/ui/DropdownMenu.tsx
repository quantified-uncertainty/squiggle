import { CheckIcon, CogIcon } from "@heroicons/react/solid";
import React, { useState } from "react";
import {
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react-dom-interactions";

type Props = {
  children: React.ReactNode;
};

type DropdownMenuType = React.FC<Props> & {
  CheckboxItem: React.FC<{ label: string; value: boolean; toggle: () => void }>;
};

export const DropdownMenu: DropdownMenuType = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { x, y, reference, floating, strategy, context } = useFloating({
    placement: "bottom-start",
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [shift()],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useRole(context, { role: "menu" }),
    useDismiss(context),
  ]);

  return (
    <div>
      <CogIcon
        className="h-5 w-5 cursor-pointer text-slate-400 hover:text-slate-500"
        onClick={() => setIsOpen(!isOpen)}
        {...getReferenceProps({ ref: reference })}
      />
      {isOpen ? (
        <div
          {...getFloatingProps({
            className: "rounded shadow z-10 bg-white",
            ref: floating,
            style: {
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
            },
          })}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

DropdownMenu.CheckboxItem = ({ label, value, toggle }) => {
  return (
    <div
      className="px-4 py-2 cursor-pointer flex space-x-2 hover:bg-gray-100"
      onClick={toggle}
    >
      {value ? (
        <CheckIcon className="w-4 h-4 text-gray-700" />
      ) : (
        <div className="w-4 h-4" />
      )}
      <span>{label}</span>
    </div>
  );
};
