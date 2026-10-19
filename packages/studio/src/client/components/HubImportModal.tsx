import { FC, useEffect, useRef, useState } from "react";

import { Button, Modal, StyledInput, useToast } from "@quri/ui";

import { API_ERROR_CODES } from "../../shared/api.js";
import { api, ApiError } from "../lib/api.js";

type Props = {
  onImported: (path: string) => void;
  close: () => void;
};

// Accepts "owner/slug", "hub:owner/slug" or a Squiggle Hub model URL.
export function parseHubReference(
  input: string
): { owner: string; slug: string } | undefined {
  const trimmed = input.trim();
  const url = trimmed.match(/\/models\/([\w-]+)\/([\w-]+)/);
  if (url) return { owner: url[1], slug: url[2] };
  const plain = trimmed.match(/^(?:hub:)?([\w-]+)\/([\w-]+)$/);
  if (plain) return { owner: plain[1], slug: plain[2] };
  return undefined;
}

export const HubImportModal: FC<Props> = ({ onImported, close }) => {
  const toast = useToast();
  const [reference, setReference] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The modal animates in through a portal, so `autoFocus` isn't reliable.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const parsed = parseHubReference(reference);
  const target = fileName || (parsed ? `hub/${parsed.slug}.squiggle` : "");

  const submit = async (overwrite = false) => {
    if (!parsed || !target) return;
    setBusy(true);
    try {
      const path = target.endsWith(".squiggle") ? target : `${target}.squiggle`;
      await api.importFromHubLegacy({ ...parsed, path, overwrite });
      toast(`Imported ${parsed.owner}/${parsed.slug}`, "confirmation");
      onImported(path);
      close();
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.code === API_ERROR_CODES.fileExists &&
        window.confirm(`${target} already exists. Overwrite it?`)
      ) {
        setBusy(false);
        return submit(true);
      }
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal close={close}>
      <Modal.Header>Import from Squiggle Hub</Modal.Header>
      <Modal.Body>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Model
            </span>
            <StyledInput
              size="small"
              ref={inputRef}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="owner/slug or https://squigglehub.org/models/owner/slug"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Save as
            </span>
            <StyledInput
              size="small"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={
                parsed ? `hub/${parsed.slug}.squiggle` : "file.squiggle"
              }
            />
          </label>
          <p className="text-xs text-slate-500">
            Downloads a copy of the model into this folder. To use a live Hub
            model instead, write{" "}
            <code className="rounded bg-slate-100 px-1">
              import &quot;hub:
              {parsed ? `${parsed.owner}/${parsed.slug}` : "owner/slug"}&quot;
              as model
            </code>
            .
          </p>
          <button type="submit" className="hidden" />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-end gap-2">
          <Button onClick={close}>Cancel</Button>
          <Button
            theme="primary"
            disabled={!parsed || busy}
            onClick={() => void submit()}
          >
            {busy ? "Importing…" : "Import"}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
