import { FC, PropsWithChildren, ReactNode, useEffect, useId } from "react";

import { Modal, XIcon } from "@quri/ui";

import { captureFocus, useOverlay } from "../commands/focus.js";

type Props = {
  testId: string;
  title: string;
  close: () => void;
  footer: ReactNode;
};

// The frame of the Explorer's modals (Open Folder, Hub import): a dialog in
// the overlay region (Studio's keys pause while it is open), with a named
// close button, that puts focus back where it was when it closes.
export const ExplorerModalFrame: FC<PropsWithChildren<Props>> = ({
  testId,
  title,
  close,
  footer,
  children,
}) => {
  useOverlay(true);
  const titleId = useId();
  useEffect(() => {
    const restore = captureFocus();
    return () => restore();
  }, []);

  return (
    <Modal close={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        data-studio-region="overlay"
        className="flex min-h-0 flex-col"
      >
        <header className="flex items-center justify-between border-b border-slate-200 py-2.5 pl-5 pr-3">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            onClick={close}
          >
            <XIcon size={16} />
          </button>
        </header>
        <Modal.Body>{children}</Modal.Body>
        <Modal.Footer>{footer}</Modal.Footer>
      </div>
    </Modal>
  );
};
