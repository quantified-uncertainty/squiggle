import { FC, useEffect, useRef, useState } from "react";

import { Button, StyledInput, useToast } from "@quri/ui";

import { API_ERROR_CODES } from "../../shared/api.js";
import { TID } from "../../shared/testIds.js";
import { ApiError } from "../lib/api.js";
import { resolveNameInput } from "../lib/explorerUi.js";
import type { Workspace } from "../lib/workspaceTypes.js";
import { ExplorerModalFrame } from "./ExplorerModalFrame.js";

type Props = {
  importModel: Workspace["importFromHub"];
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

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

// Downloads a copy of a Squiggle Hub model into the folder, through the
// workspace (which records the write as Studio's own, so it isn't listed as
// changed on disk). Cancel, Esc or closing aborts a request in flight and a
// late result is ignored; declining an overwrite just keeps the modal open
// (#49).
export const HubImportModal: FC<Props> = ({
  importModel,
  onImported,
  close,
}) => {
  const toast = useToast();
  const [reference, setReference] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  // The modal animates in through a portal, so `autoFocus` isn't reliable.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Closing the modal (Cancel, Esc, the close button, a click outside)
  // aborts an import in flight.
  useEffect(() => () => requestRef.current?.abort(), []);

  const parsed = parseHubReference(reference);
  const target =
    fileName.trim() || (parsed ? `hub/${parsed.slug}.squiggle` : "");

  const submit = async (overwrite = false): Promise<void> => {
    if (!parsed || !target || requestRef.current) return;
    const name = resolveNameInput(target, { mode: "create" });
    if (!name.ok) {
      toast(name.error, "error");
      return;
    }
    const request = new AbortController();
    requestRef.current = request;
    setBusy(true);
    try {
      const path = await importModel(`${parsed.owner}/${parsed.slug}`, {
        path: name.path,
        overwrite,
        signal: request.signal,
      });
      if (request.signal.aborted) return;
      requestRef.current = null;
      toast(`Imported ${parsed.owner}/${parsed.slug}`, "confirmation");
      onImported(path);
      close();
    } catch (e) {
      if (request.signal.aborted) return; // cancelled: nothing to report
      requestRef.current = null;
      setBusy(false);
      if (
        !overwrite &&
        e instanceof ApiError &&
        e.code === API_ERROR_CODES.fileExists
      ) {
        if (window.confirm(`${name.path} already exists. Overwrite it?`)) {
          return submit(true);
        }
        return; // declined: no error, the modal stays open
      }
      toast(errorMessage(e), "error");
    }
  };

  return (
    <ExplorerModalFrame
      testId={TID.modalHubImport}
      title="Import from Squiggle Hub"
      close={close}
      footer={
        <div className="flex justify-end gap-2" data-testid={TID.modalActions}>
          <Button onClick={close}>Cancel</Button>
          <Button
            theme="primary"
            disabled={!parsed || busy}
            onClick={() => void submit()}
          >
            {busy ? "Importing…" : "Import"}
          </Button>
        </div>
      }
    >
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
            name="hub-model"
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
            name="hub-path"
            onChange={(e) => setFileName(e.target.value)}
            placeholder={
              parsed ? `hub/${parsed.slug}.squiggle` : "file.squiggle"
            }
          />
        </label>
        <p className="text-xs text-slate-600">
          Downloads a copy of the model into this folder. To use a live Hub
          model instead, write{" "}
          <code className="rounded bg-slate-100 px-1">
            import &quot;hub:
            {parsed ? `${parsed.owner}/${parsed.slug}` : "owner/slug"}&quot; as
            model
          </code>
          .
        </p>
        <button type="submit" className="hidden" aria-label="Import" />
      </form>
    </ExplorerModalFrame>
  );
};
