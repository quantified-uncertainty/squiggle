import { ReactNode, startTransition, useCallback, useState } from "react";

import { ToolbarItem } from "./ToolbarItem.js";

type OpenModal<ModalNames extends string[]> = (
  modalName: ModalNames[number]
) => void;

type Props<ModalNames extends string[]> = {
  renderToolbar(props: { openModal: OpenModal<ModalNames> }): ReactNode;
  renderBody(): ReactNode;
  renderModal?: (modalName: ModalNames[number]) =>
    | {
        title: string;
        body: ReactNode;
      }
    | undefined; // technically undefined shouldn't be allowed, but that would cause too many type issues
};

export function PanelWithToolbar<const ModalNames extends string[]>({
  renderToolbar,
  renderBody,
  renderModal,
}: Props<ModalNames>) {
  const [modalName, setModalName] = useState<ModalNames[number] | undefined>();

  const openModal = useCallback((newModalName: ModalNames[number]) => {
    startTransition(() => setModalName(newModalName));
  }, []);

  const closeModal = useCallback(() => {
    startTransition(() => setModalName(undefined));
  }, []);

  const modal = modalName ? renderModal?.(modalName) : undefined;

  const header = modal ? (
    // We want to center the title, so need similarly-widthed items on either side
    <div className="flex h-full gap-2">
      <ToolbarItem className="w-20 shrink-0 grow-0" onClick={closeModal}>
        &larr; Back
      </ToolbarItem>
      <div className="shrink grow self-center text-center text-sm font-semibold text-slate-600">
        {modal.title}
      </div>
      <div className="invisible w-20 shrink-0 grow-0"></div>
    </div>
  ) : (
    <div className="grid h-full place-items-stretch">
      {renderToolbar({ openModal })}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 h-8 shrink-0 overflow-hidden border-b border-slate-200 bg-slate-50 px-4">
        {header}
      </div>
      {modal ? (
        <div className="overflow-auto px-4 py-4">{modal.body}</div>
      ) : (
        renderBody()
      )}
    </div>
  );
}
