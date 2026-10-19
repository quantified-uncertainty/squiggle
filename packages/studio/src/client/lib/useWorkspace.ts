// The workspace model (§2): the open folder, the working set of buffers, the
// MRU, navigation history, autosave, hash-guarded saves, external changes,
// resync and Follow. It implements the `Workspace` contract
// (workspaceTypes.ts); App provides it through WorkspaceContext.
//
// The state lives in a plain class (WorkspaceModel) with a synchronous
// snapshot, so async flows (saves, events, resyncs) always see the latest
// state; useWorkspace() subscribes React to it with useSyncExternalStore.
//
// Sync rules (§2.5–§2.8):
// - The disk is the truth. Every save sends `baseHash` (the hash the buffer
//   is based on); a 409 `disk-changed` becomes a conflict instead of an
//   overwrite (#5).
// - Events are classified by hash (sync/classify.ts): echoes of Studio's own
//   writes and content-identical events are ignored (#11, #34); a clean
//   buffer takes new content in place (externalRevision, #42); a dirty one
//   gets the conflict banner; a pending conflict clears on revert (#9).
// - An event for a path waits for Studio's in-flight writes to it.
// - On reconnect, window focus and pageshow the workspace resyncs: the root,
//   the tree and the hash of every buffer (#2).
//
// TRANSITIONAL (until WP7 lands): the M2 server sends no hashes, no `root` on
// events and has no /api/hashes. The model then fingerprints content
// locally (classify.ts: localHash), reads files to classify events, resyncs
// by reading every buffer, and drops root-less events while another window's
// folder is open. These fallbacks are marked "pre-WP7".

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type {
  RecentFolder,
  RootInfo,
  StudioEvent,
  TreeNode,
} from "../../shared/api.js";
import {
  API_ERROR_CODES,
  MAX_HASH_PATHS,
  parseHubImport,
} from "../../shared/api.js";
import { basename, normalizeRelPath } from "../../shared/paths.js";
import { getContext } from "../commands/context.js";
import { focusMain, lastUserInputAt } from "../commands/focus.js";
import {
  api,
  ApiError,
  fitsKeepalive,
  observeFileReads,
  setExpectedRoot,
} from "./api.js";
import { host } from "./host.js";
import { reportBusy } from "./idle.js";
import {
  clearViewState,
  getHistoryFlags,
  goBack,
  goForward,
  type HistoryFlags,
  onHistoryRestore,
  recordNavigation,
  renameInHistory,
  subscribeHistory,
} from "./navigation.js";
import { loadFolderState, loadViewIds } from "./storage.js";
import {
  getSettings,
  handleSettingsChanged,
  loadRootState,
  setRootState,
  subscribeStudioState,
  updateSettings,
} from "./studioState.js";
import {
  FOLLOW_BURST_MS,
  FOLLOW_SETTLE_MS,
  followBlocker,
  markSeen as markChangeSeen,
  moveChange,
  nextChangeTarget,
  recordChange,
} from "./sync/changes.js";
import {
  afterRejectedSave,
  classifyEvent,
  DELETED,
  type DiskContent,
  type DiskEvent,
  effectiveHash,
  type EventClass,
  isServerHash,
  reconcile,
} from "./sync/classify.js";
import { OwnWrites, PendingWrites, SerialQueue } from "./sync/ownWrites.js";
import {
  AutosaveScheduler,
  autosaveBlocker,
  installAutosaveTriggers,
} from "./useAutosave.js";
import {
  EventStreamController,
  HIDDEN_CLOSE_MS,
  HIDDEN_CLOSE_TEST_MS,
  type StreamStatus,
} from "./useStudioEvents.js";
import {
  ARROW_MRU_DELAY_MS,
  evictions,
  MAX_MRU,
  pushRecent,
  renameInList,
  renameKey,
  withoutPaths,
} from "./workingSet.js";
import {
  type ChangeEntry,
  isDirty,
  type OpenFile,
  type OpenReason,
  type SaveState,
  treeFilePaths,
  type Workspace,
} from "./workspaceTypes.js";

export { isDirty, type OpenFile, type Workspace } from "./workspaceTypes.js";

// How long the first connection of the event stream may count as "busy" for
// whenIdle() (so a harness never writes a file before the stream listens).
const FIRST_CONNECT_BUSY_MS = 5000;
const TREE_REFRESH_DEBOUNCE_MS = 80;

const rootStateSchemas = {
  activeFile: (v: unknown): string | null | undefined =>
    typeof v === "string" ? v : v === null ? null : undefined,
  mru: (v: unknown): string[] | undefined =>
    Array.isArray(v) && v.every((p) => typeof p === "string")
      ? (v as string[])
      : undefined,
  viewIds: (v: unknown): Record<string, string> | undefined =>
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v).every((x) => typeof x === "string")
      ? (v as Record<string, string>)
      : undefined,
};

type State = {
  rootInfo?: RootInfo;
  tree: TreeNode[];
  treeLoaded: boolean;
  treeSkipped: string[];
  recentFolders: RecentFolder[];
  files: Record<string, OpenFile>;
  activePath: string | null;
  mru: string[];
  externalChanges: Record<string, ChangeEntry>;
  followNotice?: { path: string; at: number };
  stream: StreamStatus;
  resyncing: boolean;
  rootChangedTo?: string;
  rootMissing: boolean;
  viewIds: Record<string, string>;
  history: HistoryFlags;
  saving: ReadonlySet<string>;
  autosavePending: ReadonlySet<string>;
};

const emptyFile = (path: string): OpenFile => ({
  path,
  status: "loading",
  buffer: "",
  disk: "",
  diskHash: "",
  deletedOnDisk: false,
  editorEpoch: 0,
  externalRevision: 0,
  runEpoch: 0,
});

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

const isTestMode = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("studio-test");

const isEmbed = () =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("embed") === "1";

// A 400 from the pre-WP7 server's Hub import route, which only accepts the
// legacy body {owner, slug, path}.
const isLegacyImportRejection = (e: unknown) =>
  e instanceof ApiError &&
  e.status === 400 &&
  e.code === undefined &&
  e.message.startsWith("Invalid request");

export type WorkspaceModelOptions = {
  onError: (message: string) => void;
  initialFile?: string;
};

export class WorkspaceModel {
  private state: State = {
    tree: [],
    treeLoaded: false,
    treeSkipped: [],
    recentFolders: [],
    files: {},
    activePath: null,
    mru: [],
    externalChanges: {},
    stream: "connecting",
    resyncing: false,
    rootMissing: false,
    viewIds: {},
    history: getHistoryFlags(),
    saving: new Set(),
    autosavePending: new Set(),
  };
  private snapshot: Workspace;
  private readonly listeners = new Set<() => void>();

  private root: string | undefined;
  private generation = 0;
  private booted = false;
  private initialFile: string | undefined;
  private readonly onError: (message: string) => void;

  private readonly ownWrites = new OwnWrites();
  private readonly pendingWrites = new PendingWrites();
  private readonly eventQueue = new SerialQueue();
  // The last hash seen per path (DELETED once gone), for files with and
  // without a buffer: content-identical events and dependency changes.
  private readonly knownHashes = new Map<string, string>();
  // Imported files per working-set file, filled by the linker.
  private readonly deps = new Map<string, Set<string>>();
  private treePaths = new Set<string>();
  // The tree of this root loaded at least once (else nothing is known to be
  // missing, #4).
  private treeKnown = false;
  // Most recently shown first (any reason), for eviction.
  private recency: string[] = [];
  private rootStateLoadedFor: string | undefined;
  private persisted: {
    activeFile?: string | null;
    mru?: string[];
    viewIds?: Record<string, string>;
  } = {};
  private readonly loads = new Map<string, Promise<void>>();
  private readonly inflightSaves = new Map<string, Promise<void>>();
  private readonly queuedSaves = new Map<string, Promise<void>>();
  private readonly renames = new Map<string, string>();
  private openingFolder = false;
  private resyncPromise: Promise<void> | undefined;
  private treeRefreshTimer: ReturnType<typeof setTimeout> | undefined;
  private arrowMruTimer: ReturnType<typeof setTimeout> | undefined;
  private followTimer: ReturnType<typeof setTimeout> | undefined;
  private followCandidate: string | undefined;
  private recentChanges: Array<{ path: string; at: number }> = [];
  private readonly autosaveErrors = new Map<string, string>();
  private autosaveBusy = false;
  private firstConnectBusy = false;
  private firstConnectTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly autosave: AutosaveScheduler;

  constructor(opts: WorkspaceModelOptions) {
    this.onError = opts.onError;
    this.initialFile = opts.initialFile;
    this.autosave = new AutosaveScheduler({
      save: (path, o) => void this.save(path, { explicit: false, ...o }),
      canSave: (path) => this.canAutosave(path),
      onPendingChange: (pending) => {
        const busy = pending.size > 0;
        if (busy !== this.autosaveBusy) {
          this.autosaveBusy = busy;
          reportBusy("autosave", busy);
        }
        this.set({ autosavePending: pending });
      },
    });
    this.configureAutosave();
    this.snapshot = this.buildSnapshot();
  }

  // ── Store ──────────────────────────────────────────────────────────────

  readonly subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  readonly getSnapshot = (): Workspace => this.snapshot;

  private set(patch: Partial<State>) {
    this.state = { ...this.state, ...patch };
    this.snapshot = this.buildSnapshot();
    this.persist();
    for (const cb of [...this.listeners]) cb();
  }

  private setFiles(files: Record<string, OpenFile>) {
    this.set({ files });
  }

  private setFile(path: string, file: OpenFile) {
    if (this.state.files[path] === file) return;
    this.setFiles({ ...this.state.files, [path]: file });
  }

  private updateFile(path: string, fn: (file: OpenFile) => OpenFile) {
    const file = this.state.files[path];
    if (file) this.setFile(path, fn(file));
  }

  private buildSnapshot(): Workspace {
    const s = this.state;
    return {
      rootInfo: s.rootInfo,
      tree: s.tree,
      treeLoaded: s.treeLoaded,
      treeSkipped: s.treeSkipped,
      recentFolders:
        s.rootInfo?.allowOpenFolder === false ? [] : s.recentFolders,
      files: s.files,
      activePath: s.activePath,
      mru: s.mru,
      externalChanges: s.externalChanges,
      followNotice: s.followNotice,
      connection:
        s.stream === "open"
          ? s.resyncing
            ? "resyncing"
            : "live"
          : "reconnecting",
      rootChangedTo: s.rootChangedTo,
      rootMissing: s.rootMissing,
      viewIds: s.viewIds,
      selectView: this.selectView,
      history: {
        canGoBack: s.history.canGoBack,
        canGoForward: s.history.canGoForward,
        back: goBack,
        forward: goForward,
      },
      openFile: this.openFile,
      closeFile: this.closeFile,
      setBuffer: this.setBuffer,
      saveFile: this.saveFile,
      saveAll: this.saveAll,
      flushAll: this.flushAll,
      saveState: this.saveState,
      reloadFromDisk: this.reloadFromDisk,
      overwriteWithMine: this.overwriteWithMine,
      createFile: this.createFile,
      renameFile: this.renameFile,
      importFromHub: this.importFromHub,
      openFolder: this.openFolder,
      followRootChange: this.followRootChange,
      refreshTree: this.refreshTree,
      resync: this.resync,
      recordDependency: this.recordDependency,
      markSeen: this.markSeen,
      clearChanges: this.clearChanges,
      clearRecent: this.clearRecent,
      nextChange: this.nextChange,
      setFollowChanges: this.setFollowChanges,
    };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  // Installs the event stream, autosave triggers and history listeners, and
  // loads the folder the first time. Returns a stop function (StrictMode may
  // start, stop and start again).
  start(): () => void {
    const stops: Array<() => void> = [];
    observeFileReads((file) => {
      // First sightings only: changes are noticed through events, so that a
      // read racing an event can't hide the change.
      if (!this.knownHashes.has(file.path)) {
        this.knownHashes.set(file.path, effectiveHash(file.hash, file.content));
      }
    });
    stops.push(() => observeFileReads(undefined));

    stops.push(
      subscribeStudioState(() => this.configureAutosave()),
      subscribeHistory(() => this.set({ history: getHistoryFlags() })),
      onHistoryRestore((state) => this.restoreFromHistory(state))
    );
    this.set({ history: getHistoryFlags() });

    stops.push(
      installAutosaveTriggers({
        flush: (reason) => {
          // Unloading in Electron goes through its own unsaved-changes
          // dialog (which may have discarded the edits): no unload flush.
          if (reason === "pagehide" && host.kind === "electron") return;
          void this.flushAll({ keepalive: reason !== "blur" });
        },
        leftEditor: () => {
          if (this.autosave.getMode() !== "onFocusChange") return;
          const active = this.state.activePath;
          if (active) this.autosave.flush([active]);
        },
        beforeUnload: () => this.beforeUnload(),
      })
    );

    const stream = new EventStreamController({
      onEvent: (event) => this.handleEvent(event),
      onStatus: (status) => {
        if (status === "open" && this.firstConnectBusy) {
          this.endFirstConnectBusy();
        }
        this.set({ stream: status });
      },
      onResync: () => void this.resync(),
      hiddenCloseMs: isTestMode() ? HIDDEN_CLOSE_TEST_MS : HIDDEN_CLOSE_MS,
    });
    if (!this.booted && !isEmbed()) {
      this.firstConnectBusy = true;
      reportBusy("events:connect", true);
      this.firstConnectTimer = setTimeout(
        () => this.endFirstConnectBusy(),
        FIRST_CONNECT_BUSY_MS
      );
    }
    stream.start();
    stops.push(() => stream.stop());

    if (isTestMode() && typeof window !== "undefined") {
      // Test hook (?test=1 only): the e2e scenarios read the model (Changed
      // on disk, followNotice, …) and call its methods directly.
      const w = window as Window & { __studioWorkspace?: () => Workspace };
      w.__studioWorkspace = () => this.snapshot;
      stops.push(() => {
        delete w.__studioWorkspace;
      });
    }

    if (!this.booted) {
      this.booted = true;
      void this.boot();
    }

    return () => {
      for (const stop of stops.reverse()) stop();
      this.clearTimers();
    };
  }

  private clearTimers() {
    this.cancelFollow();
    if (this.treeRefreshTimer) {
      clearTimeout(this.treeRefreshTimer);
      this.treeRefreshTimer = undefined;
      reportBusy("tree:pending", false);
    }
    if (this.arrowMruTimer) clearTimeout(this.arrowMruTimer);
    this.arrowMruTimer = undefined;
  }

  private endFirstConnectBusy() {
    if (!this.firstConnectBusy) return;
    this.firstConnectBusy = false;
    if (this.firstConnectTimer) clearTimeout(this.firstConnectTimer);
    reportBusy("events:connect", false);
  }

  private bootPromise: Promise<void> | undefined;

  // Loads the server's folder. A failure is a toast; the next resync
  // (reconnect, window focus) tries again.
  private boot(): Promise<void> {
    this.bootPromise ??= (async () => {
      reportBusy("workspace:boot", true);
      try {
        const info = await api.getRoot();
        await this.resetForRoot(info);
      } catch (e) {
        this.onError(errorMessage(e));
      } finally {
        reportBusy("workspace:boot", false);
        this.bootPromise = undefined;
      }
    })();
    return this.bootPromise;
  }

  private configureAutosave() {
    const settings = getSettings();
    this.autosave.configure(
      settings["files.autoSave"],
      settings["files.autoSaveDelay"]
    );
  }

  // ── Root ───────────────────────────────────────────────────────────────

  private async resetForRoot(info: RootInfo): Promise<void> {
    const gen = ++this.generation;
    this.autosave.cancelAll();
    this.clearTimers();
    this.ownWrites.clear();
    this.pendingWrites.clear();
    this.eventQueue.clear();
    this.knownHashes.clear();
    this.deps.clear();
    this.renames.clear();
    this.recency = [];
    this.recentChanges = [];
    this.treePaths = new Set();
    this.treeKnown = false;
    this.rootStateLoadedFor = undefined;
    this.persisted = {};
    const firstRoot = this.root === undefined;
    this.root = info.root;
    // File requests carry the root we think is open; the server rejects
    // them (409 root-changed) if it switched folders in the meantime.
    setExpectedRoot(info.root);
    if (!firstRoot) clearViewState();
    this.set({
      rootInfo: info,
      tree: [],
      treeLoaded: false,
      treeSkipped: [],
      files: {},
      activePath: null,
      mru: [],
      viewIds: {},
      externalChanges: {},
      followNotice: undefined,
      rootChangedTo: undefined,
      rootMissing: false,
    });

    // One unreadable part must not stop the rest (#4).
    const [treeResult, , stateResult] = await Promise.allSettled([
      this.refreshTreeNodes(),
      this.refreshRecentFolders(),
      loadRootState(info.root),
    ]);
    if (gen !== this.generation) return;
    if (treeResult.status === "rejected") {
      this.onError(errorMessage(treeResult.reason));
      if (!this.state.treeLoaded) this.set({ treeLoaded: true });
    }
    const treeOk = treeResult.status === "fulfilled" && this.treeKnown;
    const slice =
      stateResult.status === "fulfilled" ? stateResult.value : undefined;
    // TRANSITIONAL: until WP7's one-time migration, a root without state
    // falls back to the legacy per-origin keys (read only).
    const legacy =
      slice && ("mru" in slice || "activeFile" in slice)
        ? undefined
        : loadFolderState(info.root);
    const activeFile = legacy
      ? legacy.activeFile
      : (rootStateSchemas.activeFile(slice?.["activeFile"]) ?? null);
    const savedMru = legacy
      ? legacy.recentFiles
      : (rootStateSchemas.mru(slice?.["mru"]) ?? []);
    const viewIds =
      (slice && rootStateSchemas.viewIds(slice["viewIds"])) ??
      loadViewIds(info.root);
    const exists = (p: string) => !treeOk || this.treePaths.has(p);
    const mru = savedMru.filter(exists).slice(0, MAX_MRU);
    if (stateResult.status === "fulfilled") {
      this.rootStateLoadedFor = info.root;
      this.persisted = { activeFile, mru: savedMru, viewIds };
    }
    this.set({ mru, viewIds });

    const initialFile = this.initialFile;
    this.initialFile = undefined;
    if (initialFile) this.openFile(initialFile, { reason: "url" });
    else if (activeFile && exists(activeFile)) {
      this.openFile(activeFile, { reason: "start" });
    }
  }

  private async refreshRecentFolders() {
    const recentFolders = await api.getRecentFolders();
    this.set({ recentFolders });
  }

  private handleRootChanged(root: string) {
    if (this.openingFolder || this.root === undefined) return;
    if (root === this.root) {
      // Switched back to this window's folder: the banner goes, and what
      // happened meanwhile is re-checked (#13).
      if (this.state.rootChangedTo !== undefined) {
        this.set({ rootChangedTo: undefined });
        void this.resync();
      }
      return;
    }
    if (Object.values(this.state.files).some(isDirty)) {
      // Don't throw away unsaved edits; the banner lets the user decide.
      // Autosave is suspended and saves are disabled meanwhile.
      this.autosave.cancelAll();
      this.set({ rootChangedTo: root });
    } else {
      void this.followRootChange().catch((e: unknown) =>
        this.onError(errorMessage(e))
      );
    }
  }

  private setRootMissing() {
    if (this.state.rootMissing) return;
    this.autosave.cancelAll();
    this.set({ rootMissing: true });
  }

  // Accepts the folder switch made elsewhere, discarding unsaved edits.
  readonly followRootChange = async (): Promise<void> => {
    await this.resetForRoot(await api.getRoot());
  };

  readonly openFolder = async (folder: string): Promise<void> => {
    await this.flushAll();
    const dirty = Object.values(this.state.files).filter(isDirty).length;
    if (
      dirty > 0 &&
      !window.confirm(
        `You have unsaved changes in ${dirty} file${dirty === 1 ? "" : "s"}. Discard them and open ${folder}?`
      )
    ) {
      return;
    }
    this.openingFolder = true;
    try {
      const info = await api.openFolder(folder);
      await this.resetForRoot(info);
    } finally {
      this.openingFolder = false;
    }
  };

  // ── Tree ───────────────────────────────────────────────────────────────

  private async refreshTreeNodes(): Promise<void> {
    // Never show another folder's tree under this one's name (#13).
    if (this.state.rootChangedTo !== undefined) return;
    const gen = this.generation;
    reportBusy("tree", true);
    try {
      let response;
      try {
        response = await api.getTree();
      } catch (e) {
        if (e instanceof ApiError && e.code === API_ERROR_CODES.rootChanged) {
          if (e.root) this.handleRootChanged(e.root);
          return;
        }
        if (e instanceof ApiError && e.code === API_ERROR_CODES.rootMissing) {
          this.setRootMissing();
          return;
        }
        throw e;
      }
      if (gen !== this.generation) return;
      const previous = this.treePaths;
      const wasLoaded = this.treeKnown;
      this.treePaths = new Set(treeFilePaths(response.tree));
      this.treeKnown = true;
      this.set({
        tree: response.tree,
        treeSkipped: response.skipped,
        treeLoaded: true,
        rootMissing: false,
      });
      if (wasLoaded && !response.truncated) {
        this.afterTreeChange(previous, this.treePaths);
      }
    } finally {
      reportBusy("tree", false);
    }
  }

  // A folder renamed or deleted on disk emits no per-file events from a
  // pre-WP7 server (#12): buffers missing from the tree are confirmed with a
  // read and marked deleted; importers of files that vanished or appeared
  // re-run.
  private afterTreeChange(previous: Set<string>, next: Set<string>) {
    for (const file of Object.values(this.state.files)) {
      if (
        file.status !== "ready" ||
        file.deletedOnDisk ||
        next.has(file.path) ||
        this.pendingWrites.has(file.path)
      ) {
        continue;
      }
      const path = file.path;
      void this.eventQueue.run(path, async () => {
        const read = await this.readForSync(path);
        if (read === null) this.onDeletedOnDisk(path);
      });
    }
    for (const deps of this.deps.values()) {
      for (const dep of deps) {
        if (previous.has(dep) && !next.has(dep)) this.noteHash(dep, null);
        else if (!previous.has(dep) && next.has(dep)) this.noteAppeared(dep);
      }
    }
  }

  private scheduleTreeRefresh() {
    if (this.treeRefreshTimer) clearTimeout(this.treeRefreshTimer);
    else reportBusy("tree:pending", true);
    this.treeRefreshTimer = setTimeout(() => {
      this.treeRefreshTimer = undefined;
      void this.refreshTreeNodes()
        .catch((e: unknown) => console.warn("Tree refresh failed:", e))
        .finally(() => reportBusy("tree:pending", false));
    }, TREE_REFRESH_DEBOUNCE_MS);
  }

  // Refreshes the tree and re-checks the working set (the Explorer's Refresh
  // also resyncs). Failures are toasts, never unhandled (#35).
  readonly refreshTree = async (): Promise<void> => {
    await this.resync();
  };

  // ── Resync (#2) ────────────────────────────────────────────────────────

  readonly resync = (): Promise<void> => {
    if (this.root === undefined) return this.boot();
    this.resyncPromise ??= this.runResync().finally(() => {
      this.resyncPromise = undefined;
    });
    return this.resyncPromise;
  };

  private async runResync(): Promise<void> {
    const gen = this.generation;
    reportBusy("resync", true);
    this.set({ resyncing: true });
    try {
      let info: RootInfo;
      try {
        info = await api.getRoot();
      } catch {
        return; // still offline; the next reconnect resyncs again
      }
      if (gen !== this.generation) return;
      if (info.root !== this.root) {
        this.handleRootChanged(info.root);
        return;
      }
      if (this.state.rootChangedTo !== undefined) {
        // The server is back on this folder (a root-changed was missed).
        this.set({ rootChangedTo: undefined });
      }
      try {
        await this.refreshTreeNodes();
      } catch (e) {
        this.onError(errorMessage(e));
      }
      if (gen !== this.generation) return;
      await this.checkHashes(gen);
    } finally {
      reportBusy("resync", false);
      this.set({ resyncing: false });
    }
  }

  // Compares the hash of every buffer (and every file they import) with the
  // disk; each mismatch is handled like a file-changed event.
  private async checkHashes(gen: number) {
    const paths = new Set<string>();
    for (const file of Object.values(this.state.files)) {
      if (file.status === "ready") paths.add(file.path);
    }
    for (const deps of this.deps.values()) {
      for (const dep of deps) if (!dep.startsWith("hub:")) paths.add(dep);
    }
    if (!paths.size) return;
    const list = [...paths];
    let hashes: Record<string, string | null> = {};
    try {
      for (let i = 0; i < list.length; i += MAX_HASH_PATHS) {
        const chunk = await api.hashes(list.slice(i, i + MAX_HASH_PATHS));
        hashes = { ...hashes, ...chunk.hashes };
      }
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) throw e;
      // pre-WP7: no /api/hashes; read every file instead.
      hashes = {};
      for (const path of list) {
        const read = await this.readForSync(path).catch(() => undefined);
        if (read !== undefined) hashes[path] = read === null ? null : read.hash;
      }
    }
    if (gen !== this.generation) return;
    await Promise.all(
      Object.entries(hashes).map(([path, hash]) =>
        this.enqueueFileEvent(
          path,
          hash === null ? { exists: false } : { exists: true, hash }
        )
      )
    );
  }

  // ── Events ─────────────────────────────────────────────────────────────

  // Events carry the server's root; events for another root are dropped
  // (#13). pre-WP7 events have no root (""): they are dropped while another
  // window's folder is open.
  private isOurs(root: string): boolean {
    return root ? root === this.root : this.state.rootChangedTo === undefined;
  }

  private handleEvent(event: StudioEvent) {
    switch (event.type) {
      case "file-changed":
        if (!this.isOurs(event.root) || this.root === undefined) return;
        void this.enqueueFileEvent(event.path, {
          exists: event.exists,
          hash: event.hash,
        });
        break;
      case "tree-changed":
        if (!this.isOurs(event.root) || this.root === undefined) return;
        this.scheduleTreeRefresh();
        break;
      case "root-changed":
        this.handleRootChanged(event.root);
        break;
      case "root-missing":
        if (event.root === this.root) this.setRootMissing();
        break;
      case "settings-changed":
        // studioState re-reads the settings; the autosave mode follows
        // through subscribeStudioState.
        handleSettingsChanged();
        break;
    }
  }

  // Busy from the moment an event arrives until it is handled, so that
  // whenIdle() never resolves between the two.
  private enqueueFileEvent(path: string, event: DiskEvent): Promise<void> {
    reportBusy(`sync:${path}`, true);
    return this.eventQueue
      .run(path, () => this.processFileEvent(path, event))
      .catch((e: unknown) => console.warn(`Sync of ${path} failed:`, e))
      .finally(() => reportBusy(`sync:${path}`, false));
  }

  private classify(path: string, event: DiskEvent): EventClass {
    return classifyEvent({
      event,
      file: this.state.files[path],
      knownHash: this.knownHashes.get(path),
      ownWrite: this.ownWrites.get(path),
    });
  }

  private isDependency(path: string): boolean {
    for (const deps of this.deps.values()) if (deps.has(path)) return true;
    return false;
  }

  private async processFileEvent(path: string, event: DiskEvent) {
    const gen = this.generation;
    // An echo of a save is compared with the hash the save returned.
    await this.pendingWrites.settled(path);
    if (gen !== this.generation) return;
    let cls = this.classify(path, event);
    let read: DiskContent | null | undefined;
    if (cls.kind === "unknown") {
      // pre-WP7: no hash in the event.
      const wanted =
        path in this.state.files ||
        this.ownWrites.has(path) ||
        this.knownHashes.has(path) ||
        this.isDependency(path);
      if (!wanted) {
        cls = { kind: "changed" };
      } else {
        read = await this.readForSync(path);
        if (gen !== this.generation) return;
        cls = this.classify(
          path,
          read === null ? { exists: false } : { exists: true, hash: read.hash }
        );
      }
    }
    switch (cls.kind) {
      case "echo":
      case "identical":
      case "unknown":
        return;
      case "deleted":
        this.onDeletedOnDisk(path);
        return;
      case "changed":
        await this.onChangedOnDisk(path, event.hash, read, gen);
        return;
    }
  }

  // Reads a file for sync. Resolves to null when it doesn't exist.
  private async readForSync(path: string): Promise<DiskContent | null> {
    try {
      const file = await api.readFile(path);
      return {
        content: file.content,
        hash: effectiveHash(file.hash, file.content),
      };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      if (e instanceof ApiError && e.code === API_ERROR_CODES.rootMissing) {
        this.setRootMissing();
      }
      throw e;
    }
  }

  private onDeletedOnDisk(path: string) {
    this.ownWrites.forget(path);
    this.noteHash(path, null);
    const file = this.state.files[path];
    if (file?.status === "ready" && !file.deletedOnDisk) {
      // Autosave is suspended: it would resurrect a file the agent deleted.
      this.autosave.cancel(path);
      this.setFile(path, { ...file, deletedOnDisk: true });
    }
    this.recordExternal(path, false);
  }

  private async onChangedOnDisk(
    path: string,
    eventHash: string | undefined,
    read: DiskContent | null | undefined,
    gen: number
  ) {
    this.ownWrites.forget(path);
    let file = this.state.files[path];
    if (file?.status === "loading") {
      await this.loads.get(path);
      if (gen !== this.generation) return;
      file = this.state.files[path];
    }
    if (file?.status === "ready") {
      const disk = read === undefined ? await this.readForSync(path) : read;
      if (gen !== this.generation) return;
      if (disk === null) {
        this.onDeletedOnDisk(path);
        return;
      }
      const latest = this.state.files[path];
      if (!latest || latest.status !== "ready") return;
      const { file: next, outcome } = reconcile(latest, disk);
      this.setFile(path, next);
      this.noteHash(path, disk.hash);
      if (outcome === "identical") return;
      if (outcome === "conflict") this.autosave.cancel(path);
      if (outcome === "conflict-cleared" && isDirty(next)) {
        this.autosave.edited(path); // autosave resumes
      }
      this.recordExternal(path, true);
      return;
    }
    if (file?.status === "error") {
      void this.loadFile(path);
    }
    const hash = eventHash ?? (read ? read.hash : undefined);
    if (hash) this.noteHash(path, hash);
    else this.noteAppeared(path);
    this.recordExternal(path, true);
  }

  // A Changed-on-disk entry, plus Follow.
  private recordExternal(path: string, exists: boolean) {
    const now = Date.now();
    const known =
      this.treePaths.has(path) ||
      path in this.state.files ||
      path in this.state.externalChanges;
    const seen = path === this.state.activePath;
    this.set({
      externalChanges: recordChange(this.state.externalChanges, path, {
        exists,
        at: now,
        seen,
        known,
      }),
    });
    this.recentChanges = [
      ...this.recentChanges.filter((c) => now - c.at <= FOLLOW_BURST_MS),
      { path, at: now },
    ];
    if (exists && !seen) this.scheduleFollow(path);
  }

  // ── Dependencies (#10) ─────────────────────────────────────────────────

  readonly recordDependency = (file: string, dep: string): void => {
    if (dep === file) return;
    const deps = this.deps.get(file) ?? new Set<string>();
    deps.add(dep);
    this.deps.set(file, deps);
  };

  // Records a path's disk hash (null: deleted); importers re-run only when it
  // actually changed.
  private noteHash(path: string, hash: string | null) {
    const next = hash ?? DELETED;
    const prev = this.knownHashes.get(path);
    this.knownHashes.set(path, next);
    if (prev !== undefined && prev !== next) this.bumpImporters(path);
  }

  // A path that appeared (or whose new hash is unknown).
  private noteAppeared(path: string) {
    const prev = this.knownHashes.get(path);
    this.knownHashes.delete(path);
    if (prev !== undefined) this.bumpImporters(path);
  }

  private bumpImporters(dep: string) {
    let files = this.state.files;
    for (const [file, deps] of this.deps) {
      if (file === dep || !deps.has(dep)) continue;
      const entry = files[file];
      if (!entry) continue;
      // The new run re-records what it imports.
      deps.clear();
      files = { ...files, [file]: { ...entry, runEpoch: entry.runEpoch + 1 } };
    }
    if (files !== this.state.files) this.setFiles(files);
  }

  // ── Opening and closing ────────────────────────────────────────────────

  // Whether a path may be opened: it is in the tree, or held in the working
  // set (a buffer deleted on disk still opens, with its banner), or an event
  // just said it exists (the tree refresh may still be on its way).
  private knownToExist(path: string): boolean {
    if (!this.treeKnown) return true;
    return (
      this.treePaths.has(path) ||
      path in this.state.files ||
      this.state.externalChanges[path]?.exists === true
    );
  }

  readonly openFile = (
    rawPath: string,
    opts: { reason?: OpenReason; view?: string; focus?: "keep" | "main" } = {}
  ): void => {
    const reason = opts.reason ?? "api";
    const normalized = normalizeRelPath(rawPath);
    const path = normalized.ok ? normalized.path : rawPath;
    // A path that isn't in the folder (any more) gets a toast, not an error
    // page (#38). The URL's file still opens (embed/render reports it).
    if (reason !== "url" && !this.knownToExist(path)) {
      this.onError(
        `Can't open ${path}: it isn't in the open folder (${this.state.rootInfo?.name ?? "?"}).`
      );
      return;
    }
    const prev = this.state.activePath;
    if (prev && prev !== path) {
      // The previous file is flushed (autosave).
      this.autosave.flush([prev]);
    }
    let { files, viewIds, externalChanges, followNotice, mru } = this.state;
    const existing = files[path];
    if (!existing) files = { ...files, [path]: emptyFile(path) };
    else if (existing.status === "error") {
      // Opening a file that failed to load tries again.
      files = { ...files, [path]: { ...existing, status: "loading" } };
    }
    if (opts.view && viewIds[path] !== opts.view) {
      viewIds = { ...viewIds, [path]: opts.view };
    }
    externalChanges = markChangeSeen(externalChanges, path);
    if (followNotice && (followNotice.path === path || reason === "follow")) {
      followNotice = undefined;
    }
    this.recency = pushRecent(this.recency, path, Number.MAX_SAFE_INTEGER);
    if (this.arrowMruTimer) clearTimeout(this.arrowMruTimer);
    this.arrowMruTimer = undefined;
    if (reason === "tree-arrow") {
      // An arrow-key open counts once it has been shown for a second.
      this.arrowMruTimer = setTimeout(() => {
        this.arrowMruTimer = undefined;
        if (this.state.activePath === path) {
          this.set({ mru: pushRecent(this.state.mru, path, MAX_MRU) });
        }
      }, ARROW_MRU_DELAY_MS);
    } else {
      mru = pushRecent(mru, path, MAX_MRU);
    }
    const evict = evictions(files, path, this.recency);
    for (const p of evict) this.deps.delete(p);
    this.set({
      files: withoutPaths(files, evict),
      activePath: path,
      viewIds,
      externalChanges,
      followNotice,
      mru,
    });
    recordNavigation({ file: path, view: viewIds[path] }, reason);
    if (!this.loads.has(path) && this.state.files[path]?.status === "loading") {
      void this.loadFile(path);
    }
    if (opts.focus === "main") void focusMain();
  };

  private loadFile(path: string, opts: { hard?: boolean } = {}): Promise<void> {
    const existing = this.loads.get(path);
    if (existing && !opts.hard) return existing;
    const promise = this.readIntoBuffer(path, this.generation);
    this.loads.set(path, promise);
    const cleanup = () => {
      if (this.loads.get(path) === promise) this.loads.delete(path);
    };
    promise.then(cleanup, cleanup);
    return promise;
  }

  private async readIntoBuffer(path: string, gen: number): Promise<void> {
    reportBusy(`load:${path}`, true);
    try {
      const file = await api.readFile(path);
      if (gen !== this.generation) return;
      const hash = effectiveHash(file.hash, file.content);
      this.noteHash(path, hash);
      this.updateFile(path, (f) => ({
        ...f,
        status: "ready",
        error: undefined,
        buffer: file.content,
        disk: file.content,
        diskHash: hash,
        conflict: undefined,
        deletedOnDisk: false,
        editorEpoch: f.editorEpoch + 1,
      }));
    } catch (e) {
      if (gen !== this.generation) return;
      if (e instanceof ApiError && e.code === API_ERROR_CODES.rootMissing) {
        this.setRootMissing();
      }
      this.updateFile(path, (f) =>
        f.status === "ready"
          ? f
          : { ...f, status: "error", error: errorMessage(e) }
      );
    } finally {
      reportBusy(`load:${path}`, false);
    }
  }

  // Back/Forward (browser or Studio): show the entry's file and view
  // without recording a new entry.
  private restoreFromHistory(state: { file?: string; view?: string }) {
    if (!state.file) {
      if (this.state.activePath !== null) {
        const prev = this.state.activePath;
        this.autosave.flush([prev]);
        this.set({ activePath: null });
      }
      return;
    }
    let file = state.file;
    for (let i = 0; i < 20 && this.renames.has(file); i++) {
      file = this.renames.get(file) as string;
    }
    this.openFile(file, { reason: "history", view: state.view });
  }

  // File ▸ Close File (§2.3): flush (autosave) or confirm, remove from the
  // working set and MRU, then show the next MRU file or the start page.
  readonly closeFile = async (path: string): Promise<void> => {
    let file = this.state.files[path];
    if (file && isDirty(file)) {
      this.autosave.flush([path]);
      await this.saveSettled(path);
      file = this.state.files[path];
      if (
        file &&
        isDirty(file) &&
        !window.confirm(`${path} has unsaved changes. Close anyway?`)
      ) {
        return;
      }
    }
    this.autosave.cancel(path);
    this.deps.delete(path);
    this.recency = this.recency.filter((p) => p !== path);
    const mru = this.state.mru.filter((p) => p !== path);
    const files = withoutPaths(this.state.files, [path]);
    const wasActive = this.state.activePath === path;
    this.set({ files, mru });
    if (!wasActive) return;
    const next = mru.find((p) => this.knownToExist(p));
    if (next) this.openFile(next, { reason: "api" });
    else {
      this.set({ activePath: null });
      clearViewState();
    }
  };

  // ── Views ──────────────────────────────────────────────────────────────

  readonly selectView = (path: string, viewId: string): void => {
    if (this.state.viewIds[path] === viewId) {
      if (path === this.state.activePath) {
        recordNavigation({ file: path, view: viewId }, "api");
      }
      return;
    }
    this.set({ viewIds: { ...this.state.viewIds, [path]: viewId } });
    // A view change of the shown file is a navigation (§2.4).
    if (path === this.state.activePath) {
      recordNavigation({ file: path, view: viewId }, "api");
    }
  };

  // ── Editing and saving ─────────────────────────────────────────────────

  readonly setBuffer = (path: string, code: string): void => {
    const file = this.state.files[path];
    if (!file || file.status !== "ready" || file.buffer === code) return;
    this.setFile(path, { ...file, buffer: code });
    if (code === file.disk) this.autosave.cancel(path);
    else this.autosave.edited(path);
  };

  private canAutosave(path: string): boolean {
    const file = this.state.files[path];
    return (
      file !== undefined &&
      autosaveBlocker(file, {
        rootChanged: this.state.rootChangedTo !== undefined,
        rootMissing: this.state.rootMissing,
      }) === undefined
    );
  }

  readonly saveState = (path: string): SaveState => {
    const s = this.state;
    if (s.rootChangedTo !== undefined || s.rootMissing) return "blocked";
    if (s.saving.has(path) || s.autosavePending.has(path)) return "saving";
    const file = s.files[path];
    if (!file) return "saved";
    if (file.conflict) return "conflict";
    if (file.deletedOnDisk) return "deleted";
    return isDirty(file) ? "dirty" : "saved";
  };

  // ⌘S, Save All and the deleted banner's "Save to recreate". A file with a
  // pending conflict isn't saved (the banner's buttons decide).
  readonly saveFile = (path: string): Promise<void> =>
    this.save(path, { explicit: true });

  readonly saveAll = async (): Promise<void> => {
    const dirty = Object.values(this.state.files).filter(
      (f) => isDirty(f) && !f.conflict && !f.deletedOnDisk
    );
    await Promise.all(dirty.map((f) => this.saveFile(f.path)));
  };

  // Autosaves every eligible dirty file now (window.squiggleStudio.flush()).
  readonly flushAll = async (
    opts: { keepalive?: boolean } = {}
  ): Promise<void> => {
    const dirty = Object.values(this.state.files)
      .filter(isDirty)
      .map((f) => f.path);
    const saved = this.autosave.flush(dirty, opts);
    await Promise.all(saved.map((p) => this.saveSettled(p)));
  };

  private async saveSettled(path: string): Promise<void> {
    await this.queuedSaves.get(path)?.catch(() => undefined);
    await this.inflightSaves.get(path)?.catch(() => undefined);
  }

  // Before the page unloads: start keepalive saves; true when every unsaved
  // buffer is now being written, so there is nothing to prompt about.
  private beforeUnload(): boolean {
    if (host.kind === "electron") return false;
    const dirty = Object.values(this.state.files).filter(isDirty);
    if (!dirty.length) return false;
    this.autosave.flush(
      dirty.map((f) => f.path),
      { keepalive: true }
    );
    return dirty.every(
      (f) =>
        this.inflightSaves.has(f.path) &&
        !this.queuedSaves.has(f.path) &&
        fitsKeepalive(f.buffer)
    );
  }

  // Saves are serialized per file: at most one in flight; edits made
  // meanwhile coalesce into the next save, which reads the buffer when it
  // starts.
  private save(
    path: string,
    opts: { explicit: boolean; keepalive?: boolean; overwrite?: boolean }
  ): Promise<void> {
    const queued = this.queuedSaves.get(path);
    if (queued) return queued;
    const start = (): Promise<void> => {
      this.queuedSaves.delete(path);
      const promise = this.writeNow(path, opts);
      this.inflightSaves.set(path, promise);
      const cleanup = () => {
        if (this.inflightSaves.get(path) === promise) {
          this.inflightSaves.delete(path);
        }
      };
      promise.then(cleanup, cleanup);
      return promise;
    };
    const running = this.inflightSaves.get(path);
    if (!running) return start();
    const next = running.catch(() => undefined).then(start);
    this.queuedSaves.set(path, next);
    return next;
  }

  private async writeNow(
    path: string,
    opts: { explicit: boolean; keepalive?: boolean; overwrite?: boolean }
  ): Promise<void> {
    const file = this.state.files[path];
    if (!file || file.status !== "ready") return;
    if (this.state.rootChangedTo !== undefined) {
      if (opts.explicit) {
        throw new Error(
          `Not saved: another window switched Studio to ${basename(this.state.rootChangedTo)}.`
        );
      }
      return;
    }
    if (this.state.rootMissing) {
      if (opts.explicit) {
        throw new Error(
          `Not saved: the folder ${this.state.rootInfo?.name ?? ""} was moved or deleted.`
        );
      }
      return;
    }
    if (!opts.explicit && !this.canAutosave(path)) return;
    if (file.conflict && !opts.overwrite) return;
    if (!isDirty(file) && !file.deletedOnDisk && !opts.overwrite) return;

    const content = file.buffer;
    // "Overwrite with my edits" is a deliberate overwrite of the version the
    // conflict showed; "Save to recreate" writes unguarded.
    const base = opts.overwrite
      ? file.conflict?.hash
      : file.deletedOnDisk
        ? undefined
        : file.diskHash;
    const baseHash = isServerHash(base) ? base : undefined;
    const gen = this.generation;
    this.set({ saving: new Set([...this.state.saving, path]) });
    reportBusy(`save:${path}`, true);
    const write = api.writeFile(path, content, {
      baseHash,
      keepalive: opts.keepalive,
    });
    this.pendingWrites.track([path], write);
    try {
      const result = await write;
      if (gen !== this.generation) return;
      const hash = effectiveHash(result.hash, content);
      this.ownWrites.record(result.path, hash);
      this.autosaveErrors.delete(path);
      this.updateFile(path, (f) => ({
        ...f,
        disk: content,
        diskHash: hash,
        conflict: undefined,
        deletedOnDisk: false,
      }));
      this.noteHash(path, hash);
      // A successful save means the server is on this folder (#13).
      if (this.state.rootChangedTo !== undefined) {
        this.set({ rootChangedTo: undefined });
      }
    } catch (e) {
      if (gen !== this.generation) return;
      if (e instanceof ApiError && e.code === API_ERROR_CODES.diskChanged) {
        // The disk changed since the buffer was loaded (#5).
        const current = e.current ?? { exists: false };
        this.updateFile(path, (f) => afterRejectedSave(f, content, current));
        this.noteHash(
          path,
          current.exists
            ? effectiveHash(current.hash, current.content ?? "")
            : null
        );
        const after = this.state.files[path];
        if (after && (after.conflict || after.deletedOnDisk)) {
          this.recordExternal(path, current.exists);
        }
        return;
      }
      if (e instanceof ApiError && e.code === API_ERROR_CODES.rootChanged) {
        this.autosave.cancelAll();
        this.set({ rootChangedTo: e.root ?? "another folder" });
        if (!opts.explicit) return;
        throw new Error(
          `Not saved: Studio was switched to ${e.root ?? "another folder"} in another window.`
        );
      }
      if (e instanceof ApiError && e.code === API_ERROR_CODES.rootMissing) {
        this.setRootMissing();
        if (!opts.explicit) return;
      }
      if (opts.explicit) throw e;
      // Autosave failures: one toast per file and message.
      const message = `Couldn't save ${path}: ${errorMessage(e)}`;
      if (this.autosaveErrors.get(path) !== message) {
        this.autosaveErrors.set(path, message);
        this.onError(message);
      }
    } finally {
      reportBusy(`save:${path}`, false);
      const saving = new Set(this.state.saving);
      saving.delete(path);
      this.set({ saving });
    }
  }

  // Conflict banner: "Reload from disk" re-reads the file; it never trusts
  // the content the conflict recorded (#9).
  readonly reloadFromDisk = async (path: string): Promise<void> => {
    if (!this.state.files[path]) return;
    this.autosave.cancel(path);
    await this.pendingWrites.settled(path);
    let read: DiskContent | null;
    try {
      read = await this.readForSync(path);
    } catch (e) {
      this.onError(errorMessage(e));
      return;
    }
    if (read === null) {
      this.onDeletedOnDisk(path);
      return;
    }
    const disk = read;
    this.noteHash(path, disk.hash);
    this.updateFile(path, (f) => ({
      ...f,
      status: "ready",
      error: undefined,
      buffer: disk.content,
      disk: disk.content,
      diskHash: disk.hash,
      conflict: undefined,
      deletedOnDisk: false,
      editorEpoch: f.editorEpoch + 1,
    }));
  };

  // Conflict banner: "Overwrite with my edits" saves with baseHash = the
  // conflict's hash (a deliberate overwrite of that version).
  readonly overwriteWithMine = async (path: string): Promise<void> => {
    await this.save(path, { explicit: true, overwrite: true });
  };

  // ── Creating, renaming, importing ──────────────────────────────────────

  // The hash of what Studio just wrote at `path`: the server's, or (pre-WP7)
  // a fingerprint of the content, read back when it isn't known.
  private async writtenHash(
    path: string,
    serverHash: string,
    content?: string
  ): Promise<string> {
    if (serverHash) return serverHash;
    if (content !== undefined) return effectiveHash(undefined, content);
    const read = await this.readForSync(path).catch(() => null);
    return read ? read.hash : DELETED;
  }

  readonly createFile = async (
    rawPath: string,
    content = ""
  ): Promise<string> => {
    const normalized = normalizeRelPath(rawPath);
    if (!normalized.ok) throw new Error(normalized.error);
    const path = normalized.path;
    const work = (async () => {
      const result = await api.createFile(path, content);
      const hash = await this.writtenHash(result.path, result.hash, content);
      this.ownWrites.record(result.path, hash);
      this.noteHash(result.path, hash);
      return result.path;
    })();
    const created = await this.pendingWrites.track([path], work);
    await this.refreshTreeNodes();
    // Opens the canonical path the server returned (#8).
    this.openFile(created, { reason: "api" });
    return created;
  };

  // Renames on disk and carries over the buffer (including unsaved edits),
  // the view choice (#40), the Changed-on-disk entry (#38), the MRU and the
  // current history entry. Refuses to replace a buffer that holds unsaved
  // work (#6).
  readonly renameFile = async (
    from: string,
    rawTo: string
  ): Promise<string> => {
    const normalized = normalizeRelPath(rawTo);
    if (!normalized.ok) throw new Error(normalized.error);
    const to = normalized.path;
    if (to === from) return from;
    const target = this.state.files[to];
    if (target && (isDirty(target) || target.conflict)) {
      throw new Error(
        `Can't rename onto ${basename(to)}: it has unsaved edits.`
      );
    }
    if (target?.deletedOnDisk) {
      throw new Error(
        `Can't rename onto ${basename(to)}: it is still open after it was deleted on disk. Close it first.`
      );
    }
    // A save landing on `from` after the rename would recreate it.
    this.autosave.cancel(from);
    await this.saveSettled(from);
    await this.pendingWrites.settled(from);
    const source = this.state.files[from];
    const work = (async () => {
      const result = await api.renameFile(from, to);
      const dest = result.to;
      const hash = await this.writtenHash(
        dest,
        result.hash,
        source?.status === "ready" && !source.deletedOnDisk
          ? source.disk
          : undefined
      );
      this.ownWrites.recordDeleted(from);
      this.ownWrites.record(dest, hash);
      return { dest, hash };
    })();
    const { dest, hash } = await this.pendingWrites.track([from, to], work);

    const move = (p: string) => (p === from ? dest : p);
    let files = withoutPaths(this.state.files, [dest]);
    const moving = files[from];
    if (moving) {
      files = withoutPaths(files, [from]);
      files[dest] = { ...moving, path: dest };
    }
    this.recency = renameInList(this.recency, from, dest);
    const deps = this.deps.get(from);
    this.deps.delete(from);
    this.deps.delete(dest);
    if (deps) this.deps.set(dest, deps);
    const fromHash = this.knownHashes.get(from);
    this.noteHash(dest, hash);
    this.renames.set(from, dest);
    const notice = this.state.followNotice;
    this.set({
      files,
      activePath:
        this.state.activePath === null ? null : move(this.state.activePath),
      mru: renameInList(this.state.mru, from, dest),
      viewIds: renameKey(this.state.viewIds, from, dest),
      externalChanges: moveChange(this.state.externalChanges, from, dest),
      followNotice: notice?.path === from ? { ...notice, path: dest } : notice,
    });
    renameInHistory(from, dest);
    if (fromHash !== undefined) this.noteHash(from, null); // importers of `from` re-run
    if (moving && isDirty(files[dest])) this.autosave.edited(dest);
    await this.refreshTreeNodes();
    return dest;
  };

  readonly importFromHub = async (
    id: string,
    opts: { path?: string; overwrite?: boolean; signal?: AbortSignal } = {}
  ): Promise<string> => {
    const parsed = parseHubImport(id.startsWith("hub:") ? id : `hub:${id}`);
    if (!parsed) {
      throw new Error(`Invalid Hub id "${id}", expected owner/slug`);
    }
    const normalized = normalizeRelPath(
      opts.path ?? `hub/${parsed.slug}.squiggle`
    );
    if (!normalized.ok) throw new Error(normalized.error);
    const path = normalized.path;
    const work = (async () => {
      let result;
      try {
        result = await api.importFromHub({
          id: `hub:${parsed.owner}/${parsed.slug}`,
          path,
          overwrite: opts.overwrite,
          signal: opts.signal,
        });
      } catch (e) {
        // pre-WP7: the server only accepts the legacy body.
        if (!isLegacyImportRejection(e)) throw e;
        result = await api.importFromHubLegacy({
          ...parsed,
          path,
          overwrite: opts.overwrite,
          signal: opts.signal,
        });
      }
      // Recorded as Studio's own write, so it never shows as changed on
      // disk (#49).
      const hash = await this.writtenHash(result.path, result.hash);
      this.ownWrites.record(result.path, hash);
      return result.path;
    })();
    const imported = await this.pendingWrites.track([path], work);
    // An overwritten buffer takes the imported content.
    const open = this.state.files[imported];
    if (open?.status === "ready") {
      const read = await this.readForSync(imported);
      const latest = this.state.files[imported];
      if (read && latest?.status === "ready") {
        this.setFile(imported, reconcile(latest, read).file);
        this.noteHash(imported, read.hash);
      }
    }
    await this.refreshTreeNodes();
    return imported;
  };

  // ── Changes, Follow, MRU ───────────────────────────────────────────────

  readonly markSeen = (path: string): void => {
    const externalChanges = markChangeSeen(this.state.externalChanges, path);
    const notice = this.state.followNotice;
    if (
      externalChanges === this.state.externalChanges &&
      notice?.path !== path
    ) {
      return;
    }
    this.set({
      externalChanges,
      followNotice: notice?.path === path ? undefined : notice,
    });
  };

  readonly clearChanges = (): void => {
    this.set({ externalChanges: {}, followNotice: undefined });
  };

  readonly clearRecent = (): void => {
    this.set({ mru: [] });
  };

  readonly nextChange = (dir: 1 | -1): void => {
    const target = nextChangeTarget(
      this.state.externalChanges,
      dir,
      this.state.activePath
    );
    if (target) this.openFile(target, { reason: "api" });
  };

  readonly setFollowChanges = (on: boolean): void => {
    void updateSettings({ "squiggle.followChanges": on });
  };

  // Follow (§2.8): show a file an agent changed, unless the user is busy or
  // this is a burst. Waits FOLLOW_SETTLE_MS after the latest change, so a
  // burst is recognised before anything switches.
  private scheduleFollow(path: string) {
    if (!getSettings()["squiggle.followChanges"]) return;
    this.followCandidate = path;
    if (this.followTimer) clearTimeout(this.followTimer);
    else reportBusy("follow", true);
    this.followTimer = setTimeout(() => {
      this.followTimer = undefined;
      reportBusy("follow", false);
      this.runFollow();
    }, FOLLOW_SETTLE_MS);
  }

  private cancelFollow() {
    this.followCandidate = undefined;
    if (!this.followTimer) return;
    clearTimeout(this.followTimer);
    this.followTimer = undefined;
    reportBusy("follow", false);
  }

  private runFollow() {
    const path = this.followCandidate;
    this.followCandidate = undefined;
    if (!path || !getSettings()["squiggle.followChanges"]) return;
    const entry = this.state.externalChanges[path];
    if (!entry?.exists || entry.seen || path === this.state.activePath) return;
    const ctx = getContext();
    const now = Date.now();
    const active = this.state.activePath
      ? this.state.files[this.state.activePath]
      : undefined;
    const blocker = followBlocker({
      now,
      lastInputAt: lastUserInputAt(),
      overlayOpen: ctx["overlayOpen"] === true,
      menuOpen: ctx["menuOpen"] === true,
      textInputFocus: ctx["textInputFocus"] === true,
      activeDirty: active ? isDirty(active) : false,
      recent: this.recentChanges,
    });
    if (blocker) {
      // Only marked; the status bar says "Agent edited <file> · ⌥F5".
      this.set({ followNotice: { path, at: now } });
      return;
    }
    // Recorded in history (Back returns), with focus kept where it was.
    this.openFile(path, { reason: "follow", focus: "keep" });
  }

  // ── Persistence (§2.2: per-root state in ~/.squiggle-studio) ───────────

  private persist() {
    const root = this.root;
    // Never before the root's state has loaded (#4).
    if (!root || this.rootStateLoadedFor !== root) return;
    const { activePath, mru, viewIds } = this.state;
    if (this.persisted.activeFile !== activePath) {
      this.persisted.activeFile = activePath;
      setRootState(root, "activeFile", activePath);
    }
    if (this.persisted.mru !== mru) {
      this.persisted.mru = mru;
      setRootState(root, "mru", mru);
    }
    if (this.persisted.viewIds !== viewIds) {
      this.persisted.viewIds = viewIds;
      setRootState(root, "viewIds", viewIds);
    }
  }
}

// The workspace for App: one model per mounted App.
export function useWorkspace(options: WorkspaceModelOptions): Workspace {
  const onErrorRef = useRef(options.onError);
  onErrorRef.current = options.onError;
  const [model] = useState(
    () =>
      new WorkspaceModel({
        onError: (message) => onErrorRef.current(message),
        initialFile: options.initialFile,
      })
  );
  useEffect(() => model.start(), [model]);
  return useSyncExternalStore(
    model.subscribe,
    model.getSnapshot,
    model.getSnapshot
  );
}
