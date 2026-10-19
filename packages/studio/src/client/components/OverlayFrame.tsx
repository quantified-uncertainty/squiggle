import { clsx } from "clsx";
import { FC, KeyboardEvent, MouseEvent, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";

import {
  bindingsFor,
  getCommand,
  keyForPlatform,
  parseKey,
  type KeyEventLike,
  strokeFromEvent,
  strokeToString,
} from "../../shared/commands/index.js";
import { useOverlay } from "../commands/focus.js";
import { host } from "../lib/host.js";

// Whether a keydown is one of `commandId`'s single-stroke bindings on this
// platform and host. Overlays use it for the keys they handle while open
// (⌘P again, ⇧⌘P, the switcher's key); the dispatcher only prevents those.
export function eventMatchesCommand(
  e: KeyEventLike,
  commandId: string
): boolean {
  const spec = getCommand(commandId);
  const stroke = strokeFromEvent(e, host.platform);
  if (!spec || !stroke) return false;
  const pressed = strokeToString(stroke);
  return bindingsFor(spec, host.platform, host.kind).some((binding) => {
    const key = keyForPlatform(binding, host.platform);
    const strokes = key ? parseKey(key) : [];
    return strokes.length === 1 && strokeToString(strokes[0]) === pressed;
  });
}

type Props = {
  testId: string;
  label: string; // the dialog's accessible name
  attrs?: Record<`data-${string}`, string>;
  placement?: "top" | "center";
  className?: string; // the panel's width and height
  dim?: boolean; // a faint backdrop (modals)
  invisible?: boolean; // mounted but not painted yet (the switcher's tap)
  onDismiss: () => void; // Esc, or a pointer press outside the panel
  children: ReactNode;
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The frame shared by Quick Open, the palette, the recent-files switcher, the
// shortcut sheet and About (§3.10): a portal with a panel that is a focus
// region of its own ("overlay"), marks `overlayOpen` while mounted (the
// dispatcher then only prevents defaults), closes on Esc and outside presses,
// and keeps Tab inside. Restoring focus is the caller's job (OverlayHost).
export const OverlayFrame: FC<Props> = ({
  testId,
  label,
  attrs,
  placement = "top",
  className,
  dim = false,
  invisible = false,
  onDismiss,
  children,
}) => {
  useOverlay(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onDismiss();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = [
      ...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ];
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onBackdropDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      onDismiss();
    }
  };

  return createPortal(
    <div
      className={clsx(
        "fixed inset-0 z-50 flex justify-center px-4",
        placement === "top" ? "items-start pt-12" : "items-center py-8",
        dim && "bg-slate-900/10",
        invisible && "invisible"
      )}
      onMouseDown={onBackdropDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-testid={testId}
        data-studio-region="overlay"
        {...attrs}
        className={clsx(
          "flex max-h-full min-h-0 flex-col overflow-hidden rounded-md border border-slate-300 bg-white text-slate-800 shadow-xl",
          className
        )}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
