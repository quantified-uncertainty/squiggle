"use client";
import { FC, ReactNode, useState } from "react";

import { Button, HelpIcon, Modal } from "@quri/ui";

export const ModalHelp: FC<{
  title: string;
  body: ReactNode;
}> = ({ title, body }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <HelpIcon
        className="inline cursor-pointer text-gray-300 hover:text-gray-700"
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <Modal close={() => setIsOpen(false)}>
          <Modal.Header>
            <div className="flex items-center gap-1">
              <HelpIcon className="inline text-gray-400" />
              {title}
            </div>
          </Modal.Header>
          <Modal.Body>{body}</Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};
