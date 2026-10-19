import { FC, useEffect, useRef, useState } from "react";

import { VISIBLE_EXTENSIONS } from "../../shared/api.js";

// Adds `.squiggle` unless the name already has a supported extension.
export function withExtension(name: string): string {
  const trimmed = name.trim();
  return VISIBLE_EXTENSIONS.some((ext) => trimmed.endsWith(ext))
    ? trimmed
    : `${trimmed}.squiggle`;
}

// Text input for naming a file in the tree. Enter submits, Escape or blur
// cancels. The extension is pre-deselected so typing replaces just the name.
export const InlineNameInput: FC<{
  initialValue: string;
  style?: React.CSSProperties;
  onSubmit: (value: string) => Promise<void>;
  onCancel: () => void;
}> = ({ initialValue, style, onSubmit, onCancel }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    const base = initialValue.slice(initialValue.lastIndexOf("/") + 1);
    const dot = base.lastIndexOf(".");
    const start = initialValue.length - base.length;
    input.setSelectionRange(start, dot > 0 ? start + dot : initialValue.length);
  }, [initialValue]);

  const submit = async () => {
    if (!value.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="py-0.5 pr-2" style={style}>
      <input
        ref={ref}
        value={value}
        disabled={busy}
        aria-label="File name"
        className="w-full rounded border border-orange-300 bg-white px-1.5 py-0.5 text-sm text-slate-800 outline-none ring-2 ring-orange-100"
        onChange={(e) => {
          setValue(e.target.value);
          setError(undefined);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => {
          if (!busy) onCancel();
        }}
      />
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
};
