import { useRouter } from "next/navigation";
import { FC, use, useCallback } from "react";

import { Button, Modal } from "@quri/ui";

import { ExitConfirmationWrapperContext } from "./context";

export const ConfirmNavigationModal: FC = () => {
  const { state, dispatch } = use(ExitConfirmationWrapperContext);
  const close = useCallback(() => {
    dispatch({ type: "clearPendingLink" });
  }, [dispatch]);

  const router = useRouter();

  if (!state.pendingLink) {
    return null;
  }

  return (
    <Modal close={close}>
      <Modal.Header>You have unsaved changes</Modal.Header>
      <Modal.Body>
        Are you sure you want to leave this page? You changes are not saved.
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-end gap-2">
          <Button onClick={() => close()}>Stay on this page</Button>
          <Button
            onClick={() => {
              router.push(state.pendingLink!);
              close();
            }}
            theme="primary"
          >
            Continue
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
