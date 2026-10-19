// Global layout state (§2.2): Explorer width and visibility, status bar and
// menubar visibility, the code pane and Output's layout. Each field is its
// own global state key (`layout.<field>`), so two windows changing different
// fields never clobber each other. Publishes the context keys
// sidebarVisible, statusBarVisible and menuBarVisible.

import { z } from "zod";

import {
  createContextPublisher,
  patchContextKeys,
} from "../../commands/context.js";
import {
  getGlobalState,
  setGlobalState,
  subscribeStudioState,
  useGlobalState,
} from "../studioState.js";

export const SIDEBAR_MIN_WIDTH = 180;
export const SIDEBAR_MAX_WIDTH = 480;

export type Layout = {
  sidebarVisible: boolean;
  sidebarWidth: number;
  statusBarVisible: boolean;
  menuBarVisible: boolean;
  codePane: { open: boolean; fraction: number };
  outputLayout: "cards" | "list";
};

export const DEFAULT_LAYOUT: Layout = {
  sidebarVisible: true,
  sidebarWidth: 256,
  statusBarVisible: true,
  menuBarVisible: true,
  codePane: { open: true, fraction: 0.42 },
  outputLayout: "cards",
};

const layoutSchemas: { [K in keyof Layout]: z.ZodType<Layout[K]> } = {
  sidebarVisible: z.boolean(),
  sidebarWidth: z
    .number()
    .finite()
    .transform((w) =>
      Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, w))
    ),
  statusBarVisible: z.boolean(),
  menuBarVisible: z.boolean(),
  codePane: z.object({
    open: z.boolean(),
    fraction: z.number().min(0).max(1),
  }),
  outputLayout: z.enum(["cards", "list"]),
};

const stateKey = (key: keyof Layout) => `layout.${key}`;

export function getLayout<K extends keyof Layout>(key: K): Layout[K] {
  return getGlobalState(stateKey(key), layoutSchemas[key], DEFAULT_LAYOUT[key]);
}

export function setLayout<K extends keyof Layout>(
  key: K,
  value: Layout[K]
): void {
  setGlobalState(stateKey(key), value);
}

export function useLayout<K extends keyof Layout>(
  key: K
): [Layout[K], (value: Layout[K]) => void] {
  return useGlobalState(stateKey(key), layoutSchemas[key], DEFAULT_LAYOUT[key]);
}

export function getFullLayout(): Layout {
  return {
    sidebarVisible: getLayout("sidebarVisible"),
    sidebarWidth: getLayout("sidebarWidth"),
    statusBarVisible: getLayout("statusBarVisible"),
    menuBarVisible: getLayout("menuBarVisible"),
    codePane: getLayout("codePane"),
    outputLayout: getLayout("outputLayout"),
  };
}

const publisher = createContextPublisher();
function publishLayoutKeys() {
  patchContextKeys(publisher, {
    sidebarVisible: getLayout("sidebarVisible"),
    statusBarVisible: getLayout("statusBarVisible"),
    menuBarVisible: getLayout("menuBarVisible"),
  });
}
publishLayoutKeys();
subscribeStudioState(publishLayoutKeys);
