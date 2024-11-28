import { FC, PropsWithChildren, useState } from "react";

import { Button, Modal } from "@quri/ui";

import { useClientOnlyRender } from "@/hooks/useClientOnlyRender";
import { ModelFullDTO } from "@/server/models/data/full";

import { SquiggleSnippetFormShape } from "./EditSquiggleSnippetModel";

export type Draft = {
  formState: SquiggleSnippetFormShape;
  version: string;
};

type DraftLocator = {
  ownerSlug: string;
  modelSlug: string;
};

function draftKey(key: DraftLocator) {
  return `modelDraft:${key.ownerSlug}/${key.modelSlug}`;
}

function localStorageExists() {
  return Boolean(typeof window !== "undefined" && window.localStorage);
}

const Hint: FC<PropsWithChildren> = ({ children }) => (
  <div className="text-sm text-slate-700">{children}</div>
);

const CopyToClipboardButton: FC<{ draftLocator: DraftLocator }> = ({
  draftLocator,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = async () => {
    const draft = draftUtils.load(draftLocator);
    if (draft) {
      try {
        await navigator.clipboard.writeText(draft.formState.code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    } else {
      console.error("Draft not found");
    }
  };

  return (
    <Button onClick={handleCopyClick}>
      {isCopied ? "Copied!" : "Copy to Clipboard"}
    </Button>
  );
};

export const draftUtils = {
  exists(locator: DraftLocator): boolean {
    if (!localStorageExists()) {
      return false;
    }
    return Boolean(window.localStorage.getItem(draftKey(locator)));
  },
  save(locator: DraftLocator, draft: Draft) {
    if (!localStorageExists()) {
      return;
    }
    window.localStorage.setItem(draftKey(locator), JSON.stringify(draft));
  },
  load(locator: DraftLocator): Draft | null {
    if (!localStorageExists()) {
      throw new Error("Local storage not available");
    }
    const value = window.localStorage.getItem(draftKey(locator));
    if (!value) return null;
    return JSON.parse(value); // TODO - validate
  },
  rename(oldLocator: DraftLocator, newLocator: DraftLocator) {
    if (!localStorageExists()) {
      return;
    }
    const oldKey = draftKey(oldLocator);
    const value = window.localStorage.getItem(oldKey);
    if (!value) return null;
    const newKey = draftKey(newLocator);
    window.localStorage.setItem(newKey, value);
    window.localStorage.removeItem(oldKey);
  },
  discard(locator: DraftLocator) {
    if (!localStorageExists()) {
      return;
    }
    return window.localStorage.removeItem(draftKey(locator));
  },
};

export function useDraftLocator(model: ModelFullDTO) {
  const draftLocator: DraftLocator = {
    ownerSlug: model.owner.slug,
    modelSlug: model.slug,
  };
  return draftLocator;
}

// In some contexts, we can't use useDraftLocator, because we can't use useFragment.
// So we duck-type models instead.
export function modelToDraftLocator(model: {
  owner: {
    slug: string;
  };
  slug: string;
}): DraftLocator {
  return {
    ownerSlug: model.owner.slug,
    modelSlug: model.slug,
  };
}

type Props = {
  draftLocator: DraftLocator;
  restore: (draft: Draft) => void;
};

export const SquiggleSnippetDraftDialog: FC<Props> = ({
  draftLocator,
  restore,
}) => {
  const isClient = useClientOnlyRender();
  const [draftProcessed, setDraftProcessed] = useState(
    () => !draftUtils.exists(draftLocator)
  );

  const skip = () => {
    setDraftProcessed(true);
  };

  const discard = () => {
    draftUtils.discard(draftLocator);
    setDraftProcessed(true);
  };

  const _restore = () => {
    const draft = draftUtils.load(draftLocator);
    if (!draft) {
      throw new Error("Failed to restore draft");
    }
    restore(draft);
    setDraftProcessed(true);
  };

  return draftProcessed || !isClient ? null : (
    <Modal close={skip}>
      <Modal.Header>Unsaved Draft</Modal.Header>
      <Modal.Body>You have an unsaved draft for this model.</Modal.Body>
      <Modal.Footer>
        <div className="grid grid-cols-[minmax(180px,max-content),1fr] items-center gap-4 p-2">
          <Button onClick={skip}>Ignore</Button>
          <Hint>
            {
              "Draft will be ignored but you'll see this prompt again on next load."
            }
          </Hint>
          <Button onClick={discard}>Discard</Button>
          <Hint>Draft will be discarded and forgotten.</Hint>
          <CopyToClipboardButton draftLocator={draftLocator} />
          <Hint>Draft will be copied to clipboard.</Hint>
          <Button theme="primary" onClick={_restore}>
            Restore
          </Button>
          <Hint>
            {
              "Code and version will be replaced by draft version. You'll still need to save it manually."
            }
          </Hint>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
