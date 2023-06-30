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

  return (
    <div className="h-full flex flex-col">
      <div className="h-8 bg-slate-50 border-b border-slate-200 overflow-hidden mb-1 px-4">
        {modal ? (
          <div className="h-full flex gap-2">
            <ToolbarItem onClick={closeModal}>&larr; Back</ToolbarItem>
            <div className="self-center text-sm font-medium text-slate-600">
              {modal.title}
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-stretch">
            {renderToolbar({ openModal })}
          </div>
        )}
      </div>
      <div className="flex-1 grid place-items-stretch overflow-auto">
        {modal ? modal.body : renderBody()}
      </div>
    </div>
  );
}
