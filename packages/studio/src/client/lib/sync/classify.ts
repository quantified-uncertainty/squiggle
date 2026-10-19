// Classifying disk events and reconciling a buffer with disk content (§2.6,
// §2.7). Pure functions over OpenFile; the workspace (useWorkspace.ts) does
// the I/O.
//
// An event is compared by hash, not by time: it is an echo of our own write
// when its hash is the one we wrote (ownWrites), and content-identical when
// it equals the hash we already know (#11, #34). Only a real change reaches
// the buffer: a clean buffer takes it in place (`externalRevision`), a dirty
// one gets a conflict, and a pending conflict clears when the agent reverts
// or the disk catches up with the buffer (#9).

import type { OpenFile } from "../workspaceTypes.js";

// ── Hashes ───────────────────────────────────────────────────────────────

// Files over 5 MB have no server hash (""), so the client fingerprints their
// content itself. Local fingerprints are only ever compared with other local
// fingerprints; they are never sent as a `baseHash` and never shown as
// `data-studio-disk-hash`.
const LOCAL_PREFIX = "local:";

// cyrb53: a fast 53-bit string hash (not cryptographic; equality checks only).
function cyrb53(text: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function localHash(content: string): string {
  return `${LOCAL_PREFIX}${content.length.toString(36)}:${cyrb53(content).toString(36)}`;
}

// The server's hash when it sent one, else a local fingerprint of `content`.
export function effectiveHash(
  serverHash: string | undefined,
  content: string
): string {
  return serverHash ? serverHash : localHash(content);
}

// A hash computed by the server (sha256, 32 hex), as opposed to "" (unknown)
// or a local fingerprint.
export function isServerHash(hash: string | undefined): hash is string {
  return !!hash && !hash.startsWith(LOCAL_PREFIX);
}

// ── Events ───────────────────────────────────────────────────────────────

// The hash ownWrites records for a path Studio renamed away (or deleted).
export const DELETED = "deleted";

export type DiskEvent = { exists: boolean; hash?: string };

export type EventClass =
  // The hash is one Studio wrote itself: no highlight, no Follow, no reload.
  | { kind: "echo" }
  // The disk already had this content (touch, formatter no-op, checkout of
  // the same bytes): ignored entirely (#11).
  | { kind: "identical" }
  | { kind: "deleted" }
  // New content: the working set reads and reconciles it; for other files it
  // is recorded as a change.
  | { kind: "changed" }
  // No hash in the event (a file over 5 MB): read the file, then classify
  // again with its hash.
  | { kind: "unknown" };

export function classifyEvent(input: {
  event: DiskEvent;
  file?: OpenFile; // the working-set entry, if any
  knownHash?: string; // the last hash seen for the path (files outside the working set)
  ownWrite?: string; // the hash Studio last wrote there (DELETED for a rename source)
}): EventClass {
  const { event, file, knownHash, ownWrite } = input;
  if (!event.exists) {
    if (ownWrite === DELETED) return { kind: "echo" };
    if (file?.deletedOnDisk) return { kind: "identical" };
    if (!file && knownHash === DELETED) return { kind: "identical" };
    return { kind: "deleted" };
  }
  const hash = event.hash;
  if (!hash) return { kind: "unknown" };
  if (ownWrite !== undefined && ownWrite === hash) return { kind: "echo" };
  if (!file) {
    return knownHash === hash ? { kind: "identical" } : { kind: "changed" };
  }
  if (file.status !== "ready") return { kind: "changed" };
  if (file.conflict) {
    // The agent wrote again (or reverted): reconcile decides.
    return hash === file.conflict.hash
      ? { kind: "identical" }
      : { kind: "changed" };
  }
  if (file.deletedOnDisk) return { kind: "changed" }; // it is back
  return hash === file.diskHash ? { kind: "identical" } : { kind: "changed" };
}

// ── Reconciling a buffer with what is on disk ────────────────────────────

export type DiskContent = { content: string; hash: string };

export type ReconcileOutcome =
  // Disk content Studio already had; nothing to show.
  | "identical"
  // A clean buffer took the new content (in place: externalRevision + 1), or
  // the buffer already equalled it.
  | "applied"
  // Unsaved edits and different disk content: the conflict banner.
  | "conflict"
  // A pending conflict went away: the agent reverted to the content the
  // buffer was based on, or the disk now equals the buffer (#9).
  | "conflict-cleared";

export function reconcile(
  file: OpenFile,
  disk: DiskContent
): { file: OpenFile; outcome: ReconcileOutcome } {
  const sameAsBase =
    disk.content === file.disk ||
    (file.diskHash !== "" && disk.hash === file.diskHash);

  if (file.conflict) {
    if (disk.content === file.buffer) {
      return {
        file: {
          ...file,
          disk: disk.content,
          diskHash: disk.hash,
          conflict: undefined,
          deletedOnDisk: false,
        },
        outcome: "conflict-cleared",
      };
    }
    if (sameAsBase) {
      // Reverted: the edits are unsaved again, and autosave resumes.
      return {
        file: { ...file, conflict: undefined, deletedOnDisk: false },
        outcome: "conflict-cleared",
      };
    }
    if (
      disk.content === file.conflict.disk ||
      disk.hash === file.conflict.hash
    ) {
      return { file, outcome: "identical" };
    }
    return {
      file: { ...file, conflict: { disk: disk.content, hash: disk.hash } },
      outcome: "conflict",
    };
  }

  if (sameAsBase && !file.deletedOnDisk) {
    // Keep the server's hash once one is known (a local fingerprint until
    // then).
    return {
      file: { ...file, diskHash: preferServerHash(file.diskHash, disk.hash) },
      outcome: "identical",
    };
  }

  if (disk.content === file.buffer) {
    // The buffer already shows it (e.g. the agent wrote what the user typed).
    return {
      file: {
        ...file,
        disk: disk.content,
        diskHash: disk.hash,
        deletedOnDisk: false,
      },
      outcome: "applied",
    };
  }

  if (file.buffer === file.disk) {
    return {
      file: {
        ...file,
        buffer: disk.content,
        disk: disk.content,
        diskHash: disk.hash,
        deletedOnDisk: false,
        externalRevision: file.externalRevision + 1,
      },
      outcome: "applied",
    };
  }

  return {
    file: {
      ...file,
      conflict: { disk: disk.content, hash: disk.hash },
      deletedOnDisk: false,
    },
    outcome: "conflict",
  };
}

function preferServerHash(current: string, next: string): string {
  if (isServerHash(next)) return next;
  return isServerHash(current) ? current : next;
}

// What a guarded save's 409 `disk-changed` means for the buffer (§2.6): the
// disk already equals what we tried to write (clean), or a conflict, or the
// file is gone.
export function afterRejectedSave(
  file: OpenFile,
  attempted: string,
  current: { exists: boolean; content?: string; hash?: string }
): OpenFile {
  if (!current.exists) return { ...file, deletedOnDisk: true };
  const content = current.content ?? "";
  const hash = effectiveHash(current.hash, content);
  if (content === attempted) {
    return {
      ...file,
      disk: content,
      diskHash: hash,
      conflict: undefined,
      deletedOnDisk: false,
    };
  }
  return { ...file, conflict: { disk: content, hash }, deletedOnDisk: false };
}
