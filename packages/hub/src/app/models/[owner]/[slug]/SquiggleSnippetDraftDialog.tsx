import { FC, useState } from "react";
import { graphql, useFragment } from "react-relay";

import { Button, Modal, TextTooltip } from "@quri/ui";

import { SquiggleSnippetDraftDialog_Model$key } from "@/__generated__/SquiggleSnippetDraftDialog_Model.graphql";
import { SquiggleSnippetFormShape } from "./EditSquiggleSnippetModel";

type Draft = {
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
  discard(locator: DraftLocator) {
    if (!localStorageExists()) {
      return;
    }
    return window.localStorage.removeItem(draftKey(locator));
  },
};

export function useDraftLocator(
  modelRef: SquiggleSnippetDraftDialog_Model$key
) {
  const model = useFragment(
    graphql`
      fragment SquiggleSnippetDraftDialog_Model on Model {
        id
        slug
        owner {
          slug
        }
      }
    `,
    modelRef
  );

  const draftLocator: DraftLocator = {
    ownerSlug: model.owner.slug,
    modelSlug: model.slug,
  };
  return draftLocator;
}

type Props = {
  draftLocator: DraftLocator;
  restore: (draft: Draft) => void;
};

export const SquiggleSnippetDraftDialog: FC<Props> = ({
  draftLocator,
  restore,
}) => {
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

  return draftProcessed ? null : (
    <Modal close={skip}>
      <Modal.Header>Unsaved Draft</Modal.Header>
      <Modal.Body>You have an unsaved draft for this model.</Modal.Body>
      <Modal.Footer>
        <div className="flex items-center justify-end gap-2">
          <TextTooltip text="Draft will be ignored but you'll see this prompt again on next load.">
            <div>
              <Button onClick={skip}>Ignore</Button>
            </div>
          </TextTooltip>
          <TextTooltip text="Draft will be discarded.">
            <div>
              <Button onClick={discard}>Discard</Button>
            </div>
          </TextTooltip>
          <TextTooltip text="Code and version will be replaced by draft version. You'll still need to save it manually.">
            <div>
              <Button theme="primary" onClick={_restore}>
                Restore
              </Button>
            </div>
          </TextTooltip>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
