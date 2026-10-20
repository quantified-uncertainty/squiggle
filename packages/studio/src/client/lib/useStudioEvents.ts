// The server's event stream (Server-Sent Events at /api/events) and its
// lifecycle (§2.7, #2, #14).
//
// - After an error, EventSource reconnects by itself (the server sends
//   `retry: 1000`); when it gave up (a non-200 answer) the controller reopens
//   it. Every open after the first one asks the workspace to resync, because
//   events may have been missed meanwhile (#2).
// - The stream closes on `pagehide` and reopens on `pageshow` (the
//   back/forward cache), and closes once the page has been hidden for 5 s;
//   it reopens, with a resync, when the page is visible again. So only
//   visible Studio pages hold one of Chrome's 6 connections per origin (#14).
// - Window `focus` also asks for a resync (throttled), since an agent usually
//   edits while Studio is in the background.

import { type StudioEvent, studioEventSchema } from "../../shared/api.js";

export const HIDDEN_CLOSE_MS = 5000;
// Under `?test=1` (the e2e harness) the grace period is shortened.
export const HIDDEN_CLOSE_TEST_MS = 250;
const REOPEN_DELAY_MS = 1000;
const FOCUS_RESYNC_MIN_MS = 1000;

export type StreamStatus = "connecting" | "open" | "reconnecting" | "closed";
export type ResyncReason = "reconnect" | "visible" | "pageshow" | "focus";

export type EventSourceLike = {
  readyState: number;
  onopen: ((this: EventSource, ev: Event) => unknown) | null;
  onerror: ((this: EventSource, ev: Event) => unknown) | null;
  onmessage: ((this: EventSource, ev: MessageEvent) => unknown) | null;
  close(): void;
};

export type EventStreamOptions = {
  url?: string;
  onEvent: (event: StudioEvent) => void;
  onStatus: (status: StreamStatus) => void;
  // Events may have been missed: re-check the root, the tree and the
  // working set's hashes.
  onResync: (reason: ResyncReason) => void;
  hiddenCloseMs?: number;
  createSource?: (url: string) => EventSourceLike;
  win?: Window;
  doc?: Document;
  now?: () => number;
};

const CLOSED = 2; // EventSource.CLOSED

export class EventStreamController {
  private source: EventSourceLike | undefined;
  private status: StreamStatus = "closed";
  // An open after this one should resync (an error happened, or we closed
  // the stream ourselves).
  private needsResync = false;
  private openedOnce = false;
  // Why the next open resyncs.
  private pendingReason: ResyncReason = "reconnect";
  private hiddenTimer: ReturnType<typeof setTimeout> | undefined;
  private reopenTimer: ReturnType<typeof setTimeout> | undefined;
  private lastFocusResync = 0;
  private started = false;
  private readonly url: string;
  private readonly win: Window;
  private readonly doc: Document;
  private readonly hiddenCloseMs: number;
  private readonly now: () => number;

  constructor(private readonly opts: EventStreamOptions) {
    this.url = opts.url ?? "/api/events";
    this.win = opts.win ?? window;
    this.doc = opts.doc ?? document;
    this.hiddenCloseMs = opts.hiddenCloseMs ?? HIDDEN_CLOSE_MS;
    this.now = opts.now ?? Date.now;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.win.addEventListener("pagehide", this.onPageHide);
    this.win.addEventListener("pageshow", this.onPageShow);
    this.win.addEventListener("focus", this.onFocus);
    this.doc.addEventListener("visibilitychange", this.onVisibility);
    if (this.doc.visibilityState === "hidden") this.scheduleHiddenClose();
    this.open();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.win.removeEventListener("pagehide", this.onPageHide);
    this.win.removeEventListener("pageshow", this.onPageShow);
    this.win.removeEventListener("focus", this.onFocus);
    this.doc.removeEventListener("visibilitychange", this.onVisibility);
    this.clearTimers();
    this.close("closed");
  }

  isOpen(): boolean {
    return this.source !== undefined;
  }

  getStatus(): StreamStatus {
    return this.status;
  }

  private setStatus(status: StreamStatus) {
    if (status === this.status) return;
    this.status = status;
    this.opts.onStatus(status);
  }

  private open() {
    if (this.source || !this.started) return;
    if (this.reopenTimer) {
      clearTimeout(this.reopenTimer);
      this.reopenTimer = undefined;
    }
    const create =
      this.opts.createSource ?? ((url: string) => new EventSource(url));
    const source = create(this.url);
    this.source = source;
    this.setStatus(this.openedOnce ? "reconnecting" : "connecting");
    source.onopen = () => {
      if (this.source !== source) return;
      this.setStatus("open");
      const resync = this.openedOnce && this.needsResync;
      this.openedOnce = true;
      this.needsResync = false;
      if (resync) this.opts.onResync(this.pendingReason);
    };
    source.onerror = () => {
      if (this.source !== source) return;
      this.needsResync = true;
      this.pendingReason = "reconnect";
      this.setStatus("reconnecting");
      if (source.readyState === CLOSED) {
        // EventSource gave up (e.g. a 5xx answer); retry ourselves.
        this.source = undefined;
        source.close();
        this.reopenTimer = setTimeout(() => this.open(), REOPEN_DELAY_MS);
      }
    };
    source.onmessage = (message: MessageEvent) => {
      if (this.source !== source) return;
      let json: unknown;
      try {
        json = JSON.parse(String(message.data));
      } catch {
        return;
      }
      const parsed = studioEventSchema.safeParse(json);
      if (parsed.success) this.opts.onEvent(parsed.data);
    };
  }

  private close(status: StreamStatus) {
    const source = this.source;
    this.source = undefined;
    if (source) {
      source.onopen = null;
      source.onerror = null;
      source.onmessage = null;
      source.close();
      // Events sent while closed are missed: resync on the next open.
      if (this.openedOnce) this.needsResync = true;
    }
    this.setStatus(status);
  }

  private reopen(reason: "visible" | "pageshow") {
    if (this.source) return;
    this.pendingReason = reason;
    this.needsResync = this.openedOnce;
    this.open();
  }

  private clearTimers() {
    if (this.hiddenTimer) clearTimeout(this.hiddenTimer);
    if (this.reopenTimer) clearTimeout(this.reopenTimer);
    this.hiddenTimer = undefined;
    this.reopenTimer = undefined;
  }

  private scheduleHiddenClose() {
    if (this.hiddenTimer) return;
    this.hiddenTimer = setTimeout(() => {
      this.hiddenTimer = undefined;
      if (this.doc.visibilityState === "hidden") this.close("closed");
    }, this.hiddenCloseMs);
  }

  private readonly onVisibility = () => {
    if (this.doc.visibilityState === "hidden") {
      this.scheduleHiddenClose();
      return;
    }
    if (this.hiddenTimer) {
      clearTimeout(this.hiddenTimer);
      this.hiddenTimer = undefined;
    }
    this.reopen("visible");
  };

  private readonly onPageHide = () => {
    this.clearTimers();
    this.close("closed");
  };

  private readonly onPageShow = (e: Event) => {
    // The first load fires pageshow too (not persisted); only a page restored
    // from the back/forward cache has a closed stream to reopen.
    if (!this.source) this.reopen("pageshow");
    else if ((e as PageTransitionEvent).persisted)
      this.opts.onResync("pageshow");
  };

  private readonly onFocus = () => {
    if (!this.source || this.status !== "open") return;
    const now = this.now();
    if (now - this.lastFocusResync < FOCUS_RESYNC_MIN_MS) return;
    this.lastFocusResync = now;
    this.opts.onResync("focus");
  };
}
