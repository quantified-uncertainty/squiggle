import { describe, expect, test } from "vitest";

import {
  afterRejectedSave,
  classifyEvent,
  DELETED,
  effectiveHash,
  isServerHash,
  localHash,
  reconcile,
} from "../src/client/lib/sync/classify.js";
import type { OpenFile } from "../src/client/lib/workspaceTypes.js";

const H1 = "a".repeat(32);
const H2 = "b".repeat(32);
const H3 = "c".repeat(32);

function file(patch: Partial<OpenFile> = {}): OpenFile {
  return {
    path: "models/costs.squiggle",
    status: "ready",
    buffer: "x = 1",
    disk: "x = 1",
    diskHash: H1,
    deletedOnDisk: false,
    editorEpoch: 1,
    externalRevision: 0,
    runEpoch: 0,
    ...patch,
  };
}

describe("hashes", () => {
  test("local fingerprints are stable, distinct and never server hashes", () => {
    expect(localHash("x = 1")).toBe(localHash("x = 1"));
    expect(localHash("x = 1")).not.toBe(localHash("x = 2"));
    expect(localHash("")).not.toBe(localHash(" "));
    expect(isServerHash(localHash("x"))).toBe(false);
    expect(isServerHash(H1)).toBe(true);
    expect(isServerHash("")).toBe(false);
    expect(isServerHash(undefined)).toBe(false);
  });

  test("effectiveHash prefers the server's hash", () => {
    expect(effectiveHash(H1, "x")).toBe(H1);
    expect(effectiveHash("", "x")).toBe(localHash("x"));
    expect(effectiveHash(undefined, "x")).toBe(localHash("x"));
  });
});

describe("classifyEvent", () => {
  test("an echo of our own write is recognised by hash, not by time (#34)", () => {
    expect(
      classifyEvent({
        event: { exists: true, hash: H2 },
        file: file(),
        ownWrite: H2,
      })
    ).toEqual({ kind: "echo" });
    // An agent rewrite right after our save has another hash.
    expect(
      classifyEvent({
        event: { exists: true, hash: H3 },
        file: file({ diskHash: H2 }),
        ownWrite: H2,
      })
    ).toEqual({ kind: "changed" });
  });

  test("content-identical events are ignored (#11)", () => {
    expect(
      classifyEvent({ event: { exists: true, hash: H1 }, file: file() })
    ).toEqual({ kind: "identical" });
    // Files outside the working set compare with the last known hash.
    expect(
      classifyEvent({ event: { exists: true, hash: H1 }, knownHash: H1 })
    ).toEqual({ kind: "identical" });
    expect(
      classifyEvent({ event: { exists: true, hash: H2 }, knownHash: H1 })
    ).toEqual({ kind: "changed" });
    expect(classifyEvent({ event: { exists: true, hash: H2 } })).toEqual({
      kind: "changed",
    });
  });

  test("a new hash for a buffer is a change to reconcile", () => {
    expect(
      classifyEvent({ event: { exists: true, hash: H2 }, file: file() })
    ).toEqual({ kind: "changed" });
    expect(
      classifyEvent({
        event: { exists: true, hash: H1 },
        file: file({ status: "loading" }),
      })
    ).toEqual({ kind: "changed" });
  });

  test("deletions, and the source of our own rename", () => {
    expect(classifyEvent({ event: { exists: false }, file: file() })).toEqual({
      kind: "deleted",
    });
    expect(
      classifyEvent({
        event: { exists: false },
        file: file(),
        ownWrite: DELETED,
      })
    ).toEqual({ kind: "echo" });
    expect(
      classifyEvent({
        event: { exists: false },
        file: file({ deletedOnDisk: true }),
      })
    ).toEqual({ kind: "identical" });
    expect(
      classifyEvent({ event: { exists: false }, knownHash: DELETED })
    ).toEqual({ kind: "identical" });
    // A deleted file that comes back is a change.
    expect(
      classifyEvent({
        event: { exists: true, hash: H1 },
        file: file({ deletedOnDisk: true }),
      })
    ).toEqual({ kind: "changed" });
  });

  test("with a pending conflict, only a new version matters", () => {
    const conflicted = file({
      buffer: "mine",
      conflict: { disk: "theirs", hash: H2 },
    });
    expect(
      classifyEvent({ event: { exists: true, hash: H2 }, file: conflicted })
    ).toEqual({ kind: "identical" });
    // Reverted to the base: reconcile clears the conflict.
    expect(
      classifyEvent({ event: { exists: true, hash: H1 }, file: conflicted })
    ).toEqual({ kind: "changed" });
  });

  test("an event without a hash (pre-WP7 server) must be read", () => {
    expect(classifyEvent({ event: { exists: true }, file: file() })).toEqual({
      kind: "unknown",
    });
  });
});

describe("reconcile", () => {
  test("a clean buffer takes the new content in place (#42)", () => {
    const { file: next, outcome } = reconcile(file(), {
      content: "x = 2",
      hash: H2,
    });
    expect(outcome).toBe("applied");
    expect(next.buffer).toBe("x = 2");
    expect(next.disk).toBe("x = 2");
    expect(next.diskHash).toBe(H2);
    expect(next.externalRevision).toBe(1);
    // Not a hard replacement: the editor applies it in place.
    expect(next.editorEpoch).toBe(1);
  });

  test("a dirty buffer gets a conflict and keeps its text", () => {
    const { file: next, outcome } = reconcile(
      file({ buffer: "x = 1 # mine" }),
      {
        content: "x = 2",
        hash: H2,
      }
    );
    expect(outcome).toBe("conflict");
    expect(next.buffer).toBe("x = 1 # mine");
    expect(next.disk).toBe("x = 1");
    expect(next.conflict).toEqual({ disk: "x = 2", hash: H2 });
    expect(next.externalRevision).toBe(0);
  });

  test("identical content is nothing, and adopts the server's hash", () => {
    const local = file({ diskHash: localHash("x = 1") });
    const { file: next, outcome } = reconcile(local, {
      content: "x = 1",
      hash: H1,
    });
    expect(outcome).toBe("identical");
    expect(next.diskHash).toBe(H1);
    expect(next.externalRevision).toBe(0);
  });

  test("the agent reverting clears the conflict, edits stay unsaved (#9)", () => {
    const conflicted = file({
      buffer: "x = 1 # mine",
      conflict: { disk: "x = 4", hash: H2 },
    });
    const { file: next, outcome } = reconcile(conflicted, {
      content: "x = 1",
      hash: H1,
    });
    expect(outcome).toBe("conflict-cleared");
    expect(next.conflict).toBeUndefined();
    expect(next.buffer).toBe("x = 1 # mine");
    expect(next.buffer).not.toBe(next.disk); // still dirty: autosave resumes
  });

  test("the disk catching up with the buffer clears the conflict as saved", () => {
    const conflicted = file({
      buffer: "x = 3",
      conflict: { disk: "x = 4", hash: H2 },
    });
    const { file: next, outcome } = reconcile(conflicted, {
      content: "x = 3",
      hash: H3,
    });
    expect(outcome).toBe("conflict-cleared");
    expect(next.conflict).toBeUndefined();
    expect(next.disk).toBe("x = 3");
    expect(next.diskHash).toBe(H3);
  });

  test("another agent write during a conflict updates it", () => {
    const conflicted = file({
      buffer: "mine",
      conflict: { disk: "x = 4", hash: H2 },
    });
    const { file: next, outcome } = reconcile(conflicted, {
      content: "x = 5",
      hash: H3,
    });
    expect(outcome).toBe("conflict");
    expect(next.conflict).toEqual({ disk: "x = 5", hash: H3 });
  });

  test("a deleted file coming back: clean buffers take it, dirty conflict", () => {
    const clean = reconcile(file({ deletedOnDisk: true }), {
      content: "x = 9",
      hash: H2,
    });
    expect(clean.outcome).toBe("applied");
    expect(clean.file.deletedOnDisk).toBe(false);
    expect(clean.file.buffer).toBe("x = 9");

    const same = reconcile(file({ deletedOnDisk: true }), {
      content: "x = 1",
      hash: H1,
    });
    expect(same.file.deletedOnDisk).toBe(false);

    const dirty = reconcile(file({ buffer: "mine", deletedOnDisk: true }), {
      content: "x = 9",
      hash: H2,
    });
    expect(dirty.outcome).toBe("conflict");
    expect(dirty.file.deletedOnDisk).toBe(false);
  });

  test("the agent writing exactly what the user typed", () => {
    const { file: next, outcome } = reconcile(file({ buffer: "x = 2" }), {
      content: "x = 2",
      hash: H2,
    });
    expect(outcome).toBe("applied");
    expect(next.disk).toBe("x = 2");
    expect(next.externalRevision).toBe(0); // the editor already shows it
  });
});

describe("afterRejectedSave (409 disk-changed, #5)", () => {
  test("a conflict when the disk has other content", () => {
    const next = afterRejectedSave(file({ buffer: "mine" }), "mine", {
      exists: true,
      content: "agent",
      hash: H2,
    });
    expect(next.conflict).toEqual({ disk: "agent", hash: H2 });
    expect(next.buffer).toBe("mine");
  });

  test("clean when the disk already has what we tried to write", () => {
    const next = afterRejectedSave(file({ buffer: "same" }), "same", {
      exists: true,
      content: "same",
      hash: H3,
    });
    expect(next.conflict).toBeUndefined();
    expect(next.disk).toBe("same");
    expect(next.diskHash).toBe(H3);
  });

  test("deleted when the file is gone", () => {
    expect(
      afterRejectedSave(file({ buffer: "mine" }), "mine", { exists: false })
        .deletedOnDisk
    ).toBe(true);
  });
});
