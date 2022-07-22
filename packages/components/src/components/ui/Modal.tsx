import { motion } from "framer-motion";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { XIcon } from "@heroicons/react/solid";

const Overlay: React.FC = () => (
  <motion.div
    className="absolute inset-0 -z-10 bg-black"
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.3 }}
  />
);

const ModalHeader: React.FC<{
  close: () => void;
  children: React.ReactNode;
}> = ({ children, close }) => {
  return (
    <header className="px-5 py-3 border-b border-gray-200 font-bold flex items-center justify-between">
      <div>{children}</div>
      <button
        className="px-1 bg-transparent cursor-pointer text-gray-700 hover:text-accent-500"
        type="button"
        onClick={close}
      >
        <XIcon className="h-5 w-5 cursor-pointer text-slate-400 hover:text-slate-500" />
      </button>
    </header>
  );
};

// TODO - get rid of forwardRef, support `focus` and `{...hotkeys}` via smart props
const ModalBody = React.forwardRef<
  HTMLDivElement,
  JSX.IntrinsicElements["div"]
>(function ModalBody(props, ref) {
  return <div ref={ref} className="px-5 py-3 overflow-auto" {...props} />;
});

const ModalFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-5 py-3 border-t border-gray-200">{children}</div>
);

const ModalWindow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="bg-white rounded shadow-toast overflow-auto flex flex-col mx-2 w-96"
    style={{ maxHeight: "calc(100% - 20px)", maxWidth: "calc(100% - 20px)" }}
  >
    {children}
  </div>
);

type ModalType = React.FC<{ children: React.ReactNode }> & {
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
  Header: typeof ModalHeader;
};

export const Modal: ModalType = ({ children }) => {
  const [el] = React.useState(() => document.createElement("div"));

  React.useEffect(() => {
    document.body.appendChild(el);

    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  const modal = (
    <div className="squiggle">
      <div className="fixed inset-0 z-40 flex justify-center items-center">
        <Overlay />
        <ModalWindow>{children}</ModalWindow>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, el);
};

Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Header = ModalHeader;
