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
    <div className="h-full flex gap-2">
      <ToolbarItem
        className="flex-grow-0 flex-shrink-0 w-20"
        onClick={closeModal}
      >
        &larr; Back
      </ToolbarItem>
      <div className="flex-grow flex-shrink text-center self-center text-sm text-slate-600 font-semibold">
        {modal.title}
      </div>
      <div className="flex-grow-0 flex-shrink-0 w-20 invisible"></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="h-8 bg-slate-50 border-b border-slate-200 overflow-hidden mb-1 px-4">
        {modal ? (
          modalHeader
        ) : (
          <div className="h-full grid place-items-stretch">
            {renderToolbar({ openModal })}
          </div>
        )}
      </div>
      <div className="flex-1 grid place-items-stretch overflow-auto">
        {modal ? <div className="px-4 py-4"> {modal.body} </div> : renderBody()}
      </div>
    </div>
  );
}
