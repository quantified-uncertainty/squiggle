import { clsx } from "clsx";
import { CSSProperties, FC, useEffect, useId, useRef, useState } from "react";

import { basename, extname } from "../../shared/paths.js";
import { TID } from "../../shared/testIds.js";

type Props = {
  mode: "create" | "rename";
  initialValue: string;
  selection: [number, number]; // selected range of `initialValue`
  style?: CSSProperties;
  // Resolves when done; a thrown error is shown under the input.
  onSubmit: (value: string) => Promise<void>;
  onCancel: () => void;
};

// The name's range in `value` (the last segment without its extension).
function nameRange(value: string): [number, number] {
  const name = basename(value);
  const start = value.length - name.length;
  return [start, value.length - extname(value).length];
}

// The inline input for New File, New Folder and Rename (§3.9.1). Enter
// submits; Esc, a pointerdown outside and focus moving to another element of
// the page cancel (switching to another window doesn't). While a request is
// in flight the input is readOnly and aria-busy, never disabled, so it keeps
// focus (#16); on an error it keeps focus with the name selected and shows
// the message.
export const InlineNameInput: FC<Props> = ({
  mode,
  initialValue,
  selection,
  style,
  onSubmit,
  onCancel,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const doneRef = useRef(false);
  const busyRef = useRef(false);
  const errorId = useId();
  const latest = useRef({ onCancel });
  latest.current = { onCancel };

  const cancel = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    latest.current.onCancel();
  };

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(selection[0], selection[1]);
    // Only on mount: a new request remounts the input (it is keyed by id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A pointerdown anywhere else cancels.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) cancel();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (busyRef.current || doneRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await onSubmit(value);
      doneRef.current = true;
    } catch (e) {
      busyRef.current = false;
      if (doneRef.current) return;
      setBusy(false);
      setError(e instanceof Error ? e.message : String(e));
      const input = inputRef.current;
      if (input) {
        input.focus();
        const [start, end] = nameRange(input.value);
        input.setSelectionRange(start, end);
      }
    }
  };

  return (
    <div ref={ref} className="py-0.5 pr-2" style={style}>
      <input
        ref={inputRef}
        value={value}
        readOnly={busy}
        aria-busy={busy || undefined}
        aria-label={mode === "rename" ? "New name" : "File name"}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={error ? errorId : undefined}
        data-testid={TID.nameInput}
        data-mode={mode}
        spellCheck={false}
        autoComplete="off"
        className={clsx(
          "h-[22px] w-full rounded-sm border bg-white px-1.5 text-[13px] text-slate-800 outline-none focus-visible:ring-2",
          error
            ? "border-red-500 focus-visible:ring-red-200"
            : "border-slate-300 focus-visible:ring-orange-300"
        )}
        onChange={(e) => {
          setValue(e.target.value);
          setError(undefined);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void submit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancel();
          }
        }}
        onBlur={(e) => {
          // Focus moved to another element of this page (Tab, F6). A null
          // relatedTarget means another window or the page itself; keep the
          // input then, and while a request is in flight (the Explorer moves
          // focus itself when it is done).
          if (busyRef.current || e.relatedTarget === null) return;
          if (!ref.current?.contains(e.relatedTarget)) cancel();
        }}
      />
      {error && (
        <div
          id={errorId}
          role="alert"
          className="mt-1 rounded-sm bg-red-50 px-1.5 py-0.5 text-xs text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  );
};
