// Stable `data-testid` values (§6.5), imported by components and the e2e
// harness. Dynamic data goes in attributes (listed per id), never in ids.

export const TID = {
  // Shell
  appHeader: "app-header",
  menubar: "menubar",
  menubarTrigger: "menubar-trigger", // [data-menu]
  menu: "menu", // [data-menu]
  menuitem: "menuitem", // [data-command, aria-checked]
  commandCenter: "command-center",
  explorerToggle: "explorer-toggle",
  statusbar: "statusbar",
  statusbarItem: "statusbar-item", // [data-status-item, data-state]
  rootBanner: "root-banner", // [data-kind=changed|missing]
  startPage: "start-page",
  toast: "toast",
  // Explorer
  explorer: "explorer",
  explorerHeader: "explorer-header",
  changedOnDisk: "changed-on-disk",
  changedOnDiskItem: "changed-on-disk-item", // [data-path, data-exists, data-seen]
  fileTree: "file-tree",
  fileTreeItem: "file-tree-item", // [data-path, data-kind=file|dir, data-dirty, data-changed, aria-expanded, aria-selected]
  nameInput: "name-input", // [data-mode=create|rename]
  modalOpenFolder: "modal-open-folder",
  modalHubImport: "modal-hub-import",
  // Editor
  editorHeader: "editor-header",
  breadcrumb: "breadcrumb",
  viewSwitcher: "view-switcher",
  viewTab: "view-tab", // [data-view, aria-selected]
  viewToolbar: "view-toolbar",
  codeToggle: "code-toggle",
  codePane: "code-pane",
  textEditor: "text-editor",
  fileBanner: "file-banner", // [data-kind=conflict|deleted]
  // Output
  outputView: "output-view", // [data-layout]
  outputCard: "output-card", // [data-variable, data-value-type]
  outputError: "output-error",
  layoutToggle: "layout-toggle",
  // Relative values
  rvView: "rv-view",
  rvSpecPicker: "rv-spec-picker",
  rvTab: "rv-tab", // [data-tab]
  rvListRow: "rv-list-row", // [data-item]
  rvGridCell: "rv-grid-cell", // [data-row, data-col]
  rvPairSidebar: "rv-pair-sidebar",
  rvPlot: "rv-plot",
  rvError: "rv-error",
  // Overlays
  quickPick: "quick-pick", // [data-mode=files|commands|pick]
  quickPickItem: "quick-pick-item", // [data-command | data-path]
  recentFilesSwitcher: "recent-files-switcher",
  shortcutSheet: "shortcut-sheet",
  aboutModal: "about-modal",
  chordIndicator: "chord-indicator",
} as const;

export type TestId = (typeof TID)[keyof typeof TID];
