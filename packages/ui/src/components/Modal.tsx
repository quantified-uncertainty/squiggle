"use client";
import { XIcon } from "../icons/XIcon.js";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import {
  PropsWithChildren,
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { useWindowScroll, useWindowSize } from "../hooks/react-use.js";
import { TailwindContext } from "./TailwindProvider.js";

type ModalContextShape = {
  close: () => void;
};
const ModalContext = createContext<ModalContextShape>({
  close: () => undefined,
});

const Overlay: React.FC = () => {
  const { close } = useContext(ModalContext);
  return (
    <motion.div
      className="absolute inset-0 -z-10 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.1 }}
      onClick={close}
    />
  );
};

const ModalHeader: React.FC<PropsWithChildren> = ({ children }) => {
  const { close } = useContext(ModalContext);
  return (
    <header className="pl-5 pr-4 py-3 border-b border-gray-200 font-bold flex items-center justify-between">
      <div>{children}</div>
      <button
        className="bg-transparent cursor-pointer text-slate-300 hover:text-slate-500"
        type="button"
        onClick={close}
      >
        <XIcon size={16} className="m-1" />
      </button>
    </header>
  );
};

// TODO - get rid of forwardRef, support `focus` and `{...hotkeys}` via smart props
const ModalBody = forwardRef<HTMLDivElement, JSX.IntrinsicElements["div"]>(
  function ModalBody(props, ref) {
    return <div ref={ref} className="px-5 py-3 overflow-auto" {...props} />;
  }
);

const ModalFooter: React.FC<PropsWithChildren> = ({ children }) => (
  <div className="px-5 py-3 border-t border-gray-200">{children}</div>
);

const ModalWindow: React.FC<
  PropsWithChildren<{
    container?: HTMLElement;
  }>
> = ({ children, container }) => {
  // This component works in two possible modes:
  // 1. container mode - the modal is rendered inside a container element
  // 2. centered mode - the modal is rendered in the middle of the screen
  // The mode is determined by the presence of the `container` prop and by whether the available space is large enough to fit the modal.

  // Necessary for container mode - need to reposition the modal on scroll and resize events.
  useWindowSize();
  useWindowScroll();

  let position:
    | {
        left: number;
        top: number;
        maxWidth: number;
        maxHeight: number;
        transform: string;
      }
    | undefined;

  // If available space in `visibleRect` is smaller than these, fallback to positioning in the middle of the screen.
  const minWidth = 384;
  const minHeight = 300;
  const offset = 8;
  const naturalWidth = 576; // maximum possible width; modal tries to take this much space, but can be smaller

  if (container) {
    const { clientWidth: screenWidth, clientHeight: screenHeight } =
      document.documentElement;
    const rect = container?.getBoundingClientRect();

    const visibleRect = {
      left: Math.max(rect.left, 0),
      right: Math.min(rect.right, screenWidth),
      top: Math.max(rect.top, 0),
      bottom: Math.min(rect.bottom, screenHeight),
    };
    const maxWidth = visibleRect.right - visibleRect.left - 2 * offset;
    const maxHeight = visibleRect.bottom - visibleRect.top - 2 * offset;

    const center = {
      left: visibleRect.left + (visibleRect.right - visibleRect.left) / 2,
      top: visibleRect.top + (visibleRect.bottom - visibleRect.top) / 2,
    };
    position = {
      left: center.left,
      top: center.top,
      transform: "translate(-50%, -50%)",
      maxWidth,
      maxHeight,
    };
    if (maxWidth < minWidth || maxHeight < minHeight) {
      position = undefined; // modal is hard to fit in the container, fallback to positioning it in the middle of the screen
    }
  }

  return (
    <div
      className={clsx(
        "bg-white rounded-md shadow-toast flex flex-col overflow-auto border",
        position && "fixed"
      )}
      style={{
        width: naturalWidth,
        ...(position ?? {
          maxHeight: "calc(100% - 20px)",
          maxWidth: "calc(100% - 20px)",
          width: naturalWidth,
        }),
      }}
    >
      {children}
    </div>
  );
};

type ModalType = React.FC<
  PropsWithChildren<{
    // if specified, modal will be positioned over the visible part of the container, if it's not too small
    container?: HTMLElement;
    close: () => void;
  }>
> & {
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
  Header: typeof ModalHeader;
};

export const Modal: ModalType = ({ children, container, close }) => {
  const [el] = useState(() => document.createElement("div"));

  const { selector: tailwindSelector } = useContext(TailwindContext);

  useEffect(() => {
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [close]);

  const modal = (
    <ModalContext.Provider value={{ close }}>
      <div className={tailwindSelector}>
        <div className="fixed inset-0 z-40 flex justify-center items-center">
          <Overlay />
          <ModalWindow container={container}>{children}</ModalWindow>
        </div>
      </div>
    </ModalContext.Provider>
  );

  return createPortal(modal, container || el);
};

Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Header = ModalHeader;
