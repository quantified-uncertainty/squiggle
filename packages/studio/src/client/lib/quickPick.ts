// A request bus for generic pickers (§3.10): any package can ask for a quick
// pick (e.g. Open Recent); OverlayHost (WP2) renders it with QuickPick.

export type QuickPickItem = {
  id: string;
  label: string;
  description?: string; // dim text after the label (a folder hint)
  group?: string; // section header; items of a group are contiguous
  disabled?: boolean;
};

export type QuickPickOptions = { title?: string; placeholder?: string };

export type QuickPickRequest = {
  items: QuickPickItem[];
  opts: QuickPickOptions;
  // Called once with the chosen item, or undefined when dismissed.
  resolve: (item: QuickPickItem | undefined) => void;
};

const handlers: Array<(req: QuickPickRequest) => void> = [];

// Throws when no OverlayHost is mounted (fail early: the caller's command
// then reports the error).
export function showQuickPick(
  items: QuickPickItem[],
  opts: QuickPickOptions = {}
): Promise<QuickPickItem | undefined> {
  const handler = handlers[handlers.length - 1];
  if (!handler) {
    return Promise.reject(new Error("No quick pick host is mounted"));
  }
  return new Promise((resolve) => {
    let settled = false;
    handler({
      items,
      opts,
      resolve: (item) => {
        if (settled) return;
        settled = true;
        resolve(item);
      },
    });
  });
}

// The last registered handler receives requests. Returns an unsubscribe.
export function onQuickPickRequest(
  handler: (req: QuickPickRequest) => void
): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  };
}
