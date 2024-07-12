import { useRouter } from "next/navigation";
import { FC, use, useCallback } from "react";

import { Button, Modal } from "@quri/ui";

import { NavigationBlockerContext } from "./context";

export const InterceptedLinkModal: FC = () => {
  const { state, dispatch } = use(NavigationBlockerContext);
  const close = useCallback(() => {
    dispatch({ type: "clearInterceptedLink" });
  }, [dispatch]);

  const router = useRouter();

  if (!state.interceptedLink) {
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
              router.push(state.interceptedLink!);
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
