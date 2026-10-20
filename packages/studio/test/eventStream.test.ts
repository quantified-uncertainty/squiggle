// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  type EventSourceLike,
  EventStreamController,
  HIDDEN_CLOSE_MS,
  type ResyncReason,
  type StreamStatus,
} from "../src/client/lib/useStudioEvents.js";

// A fake EventSource the test opens, fails and feeds by hand.
class FakeSource {
  static all: FakeSource[] = [];
  readyState = 0;
  closed = false;
  onopen: ((ev: Event) => unknown) | null = null;
  onerror: ((ev: Event) => unknown) | null = null;
  onmessage: ((ev: MessageEvent) => unknown) | null = null;
  constructor(readonly url: string) {
    FakeSource.all.push(this);
  }
  open() {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }
  fail(closed = false) {
    this.readyState = closed ? 2 : 0;
    this.onerror?.(new Event("error"));
  }
  send(data: unknown) {
    this.onmessage?.(
      new MessageEvent("message", { data: JSON.stringify(data) })
    );
  }
  close() {
    this.closed = true;
    this.readyState = 2;
  }
}

let visibility: DocumentVisibilityState = "visible";

function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  document.dispatchEvent(new Event("visibilitychange"));
}

const live = () => FakeSource.all.filter((s) => !s.closed);
const latest = () => FakeSource.all[FakeSource.all.length - 1];

describe("EventStreamController (#2, #14)", () => {
  let resyncs: ResyncReason[];
  let statuses: StreamStatus[];
  let events: unknown[];
  let controller: EventStreamController;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeSource.all = [];
    visibility = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibility,
    });
    resyncs = [];
    statuses = [];
    events = [];
    controller = new EventStreamController({
      onEvent: (e) => events.push(e),
      onStatus: (s) => statuses.push(s),
      onResync: (r) => resyncs.push(r),
      createSource: (url) => new FakeSource(url) as unknown as EventSourceLike,
    });
    controller.start();
  });

  afterEach(() => {
    controller.stop();
    vi.useRealTimers();
  });

  test("the first open doesn't resync; events are parsed and validated", () => {
    expect(FakeSource.all).toHaveLength(1);
    expect(latest()?.url).toBe("/api/events");
    latest()?.open();
    expect(statuses).toEqual(["connecting", "open"]);
    expect(resyncs).toEqual([]);
    latest()?.send({ type: "tree-changed", root: "/r" });
    latest()?.send({ type: "nonsense" });
    expect(events).toEqual([{ type: "tree-changed", root: "/r" }]);
  });

  test("every open after an error resyncs (#2)", () => {
    latest()?.open();
    latest()?.fail();
    expect(statuses.at(-1)).toBe("reconnecting");
    // EventSource reconnects by itself.
    latest()?.open();
    expect(resyncs).toEqual(["reconnect"]);
    latest()?.fail();
    latest()?.open();
    expect(resyncs).toEqual(["reconnect", "reconnect"]);
  });

  test("a stream EventSource gave up on is reopened", () => {
    latest()?.open();
    latest()?.fail(true);
    expect(live()).toHaveLength(0);
    vi.advanceTimersByTime(1000);
    expect(live()).toHaveLength(1);
    latest()?.open();
    expect(resyncs).toEqual(["reconnect"]);
  });

  test("closed 5 s after the page is hidden; reopened with one resync when visible", () => {
    latest()?.open();
    setVisibility("hidden");
    vi.advanceTimersByTime(HIDDEN_CLOSE_MS - 1);
    expect(live()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(live()).toHaveLength(0);
    setVisibility("visible");
    expect(live()).toHaveLength(1);
    latest()?.open();
    expect(resyncs).toEqual(["visible"]);
  });

  test("not closed when visible again within 5 s", () => {
    latest()?.open();
    setVisibility("hidden");
    vi.advanceTimersByTime(HIDDEN_CLOSE_MS - 100);
    setVisibility("visible");
    vi.advanceTimersByTime(HIDDEN_CLOSE_MS * 2);
    expect(FakeSource.all).toHaveLength(1);
    expect(live()).toHaveLength(1);
    expect(resyncs).toEqual([]);
  });

  test("closed on pagehide, reopened (with a resync) on pageshow", () => {
    latest()?.open();
    window.dispatchEvent(new Event("pagehide"));
    expect(live()).toHaveLength(0);
    window.dispatchEvent(new Event("pageshow"));
    expect(live()).toHaveLength(1);
    latest()?.open();
    expect(resyncs).toEqual(["pageshow"]);
  });

  test("the first pageshow (a normal load) changes nothing", () => {
    window.dispatchEvent(new Event("pageshow"));
    expect(FakeSource.all).toHaveLength(1);
  });

  test("window focus resyncs, at most once a second", () => {
    latest()?.open();
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("focus"));
    expect(resyncs).toEqual(["focus"]);
    vi.setSystemTime(Date.now() + 1500);
    window.dispatchEvent(new Event("focus"));
    expect(resyncs).toEqual(["focus", "focus"]);
  });

  test("stop closes the stream and removes the listeners", () => {
    latest()?.open();
    controller.stop();
    expect(live()).toHaveLength(0);
    window.dispatchEvent(new Event("pageshow"));
    setVisibility("visible");
    expect(live()).toHaveLength(0);
  });
});
