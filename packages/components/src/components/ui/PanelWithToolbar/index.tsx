import { ReactNode, useCallback, useState } from "react";

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
    setModalName(newModalName);
  }, []);

  const closeModal = useCallback(() => {
    setModalName(undefined);
  }, []);

  const modal = modalName ? renderModal?.(modalName) : undefined;

  //We want to center the title, so need similarly-widthed items on either side
  const modalHeader = modal && (
    <div className="flex h-full gap-2">
      <ToolbarItem
        className="w-20 flex-shrink-0 flex-grow-0"
        onClick={closeModal}
      >
        &larr; Back
      </ToolbarItem>
      <div className="flex-shrink flex-grow self-center text-center text-sm font-semibold text-slate-600">
        {modal.title}
      </div>
      <div className="invisible w-20 flex-shrink-0 flex-grow-0"></div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 h-8 overflow-hidden border-b border-slate-200 bg-slate-50 px-4">
        {modal ? (
          modalHeader
        ) : (
          <div className="grid h-full place-items-stretch">
            {renderToolbar({ openModal })}
          </div>
        )}
      </div>
      <div className="grid flex-1 place-items-stretch overflow-auto">
        {modal ? <div className="px-4 py-4"> {modal.body} </div> : renderBody()}
      </div>
    </div>
  );
}
