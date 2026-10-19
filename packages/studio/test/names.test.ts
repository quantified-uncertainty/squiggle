import { describe, expect, test } from "vitest";

import {
  displayFolderPath,
  folderName,
  folderParent,
  freeName,
  NAME_MESSAGES,
  newFileDraft,
  newFolderDraft,
  renameDraft,
  resolveNameInput,
  targetDir,
  treeKeyCommand,
} from "../src/client/lib/explorerUi.js";
import { PATH_MESSAGES } from "../src/shared/paths.js";

const create = { mode: "create" } as const;
const rename = (from: string) => ({ mode: "rename", from }) as const;

describe("resolveNameInput: non-canonical names become canonical (#8)", () => {
  test.each([
    ["./x", "x.squiggle"],
    ["a//b", "a/b.squiggle"],
    ["a\\b", "a/b.squiggle"],
    ["m/./n", "m/n.squiggle"],
    ["  lib/costs  ", "lib/costs.squiggle"],
  ])("%s → %s", (input, path) => {
    expect(resolveNameInput(input, create)).toEqual({ ok: true, path });
  });

  test.each([
    ["../evil", PATH_MESSAGES.parent],
    ["lib/../x", PATH_MESSAGES.parent],
    [".hidden", PATH_MESSAGES.hidden],
    ["lib/.secret/x", PATH_MESSAGES.hidden],
    ["", PATH_MESSAGES.empty],
    ["   ", PATH_MESSAGES.empty],
    ["C:\\models\\x", PATH_MESSAGES.absolute],
  ])("%j is refused: %s", (input, error) => {
    expect(resolveNameInput(input, create)).toEqual({ ok: false, error });
  });
});

describe("resolveNameInput: extensions (#39)", () => {
  test("creating a bare name adds .squiggle", () => {
    expect(resolveNameInput("main", create)).toEqual({
      ok: true,
      path: "main.squiggle",
    });
  });

  test("supported extensions are kept", () => {
    expect(resolveNameInput("notes.md", create)).toEqual({
      ok: true,
      path: "notes.md",
    });
    expect(resolveNameInput("data.json", create)).toEqual({
      ok: true,
      path: "data.json",
    });
  });

  test("renaming without an extension keeps the source's extension", () => {
    expect(resolveNameInput("README", rename("readme-test.md"))).toEqual({
      ok: true,
      path: "README.md",
    });
    expect(resolveNameInput("lib/data", rename("data.json"))).toEqual({
      ok: true,
      path: "lib/data.json",
    });
    expect(resolveNameInput("other", rename("main.squiggle"))).toEqual({
      ok: true,
      path: "other.squiggle",
    });
  });

  test("renaming to another supported extension is allowed", () => {
    expect(resolveNameInput("notes.squiggle", rename("notes.md"))).toEqual({
      ok: true,
      path: "notes.squiggle",
    });
  });

  test("unsupported extensions are refused, not suffixed", () => {
    expect(resolveNameInput("z.txt", create)).toEqual({
      ok: false,
      error: NAME_MESSAGES.unsupported,
    });
    expect(resolveNameInput("z.txt", rename("z.md"))).toEqual({
      ok: false,
      error: "Studio edits .squiggle, .json and .md files",
    });
  });

  test('a trailing "/" asks for a file name', () => {
    expect(resolveNameInput("trail/", create)).toEqual({
      ok: false,
      error: "Enter a file name",
    });
    expect(resolveNameInput("lib/", rename("costs.squiggle"))).toEqual({
      ok: false,
      error: "Enter a file name",
    });
  });
});

describe("default names (#16)", () => {
  const taken = new Set([
    "untitled.squiggle",
    "untitled-1.squiggle",
    "lib",
    "lib/untitled.squiggle",
    "new-folder",
  ]);

  test("freeName picks the first free untitled-N", () => {
    expect(freeName(taken, "", "untitled", ".squiggle")).toBe(
      "untitled-2.squiggle"
    );
    expect(freeName(taken, "lib", "untitled", ".squiggle")).toBe(
      "untitled-1.squiggle"
    );
    expect(freeName(taken, "text", "untitled", ".squiggle")).toBe(
      "untitled.squiggle"
    );
  });

  test("New File selects only the name", () => {
    const draft = newFileDraft(taken, "lib");
    expect(draft.value).toBe("lib/untitled-1.squiggle");
    expect(draft.value.slice(...draft.selection)).toBe("untitled-1");
    const atRoot = newFileDraft(new Set(), "");
    expect(atRoot.value).toBe("untitled.squiggle");
    expect(atRoot.value.slice(...atRoot.selection)).toBe("untitled");
  });

  test("New Folder selects the folder name", () => {
    const draft = newFolderDraft(taken, "");
    expect(draft.value).toBe("new-folder-1/untitled.squiggle");
    expect(draft.value.slice(...draft.selection)).toBe("new-folder-1");
    const inLib = newFolderDraft(taken, "lib");
    expect(inLib.value).toBe("lib/new-folder/untitled.squiggle");
    expect(inLib.value.slice(...inLib.selection)).toBe("new-folder");
  });

  test("Rename selects the name without its extension", () => {
    const draft = renameDraft("lib/costs.squiggle");
    expect(draft.value).toBe("lib/costs.squiggle");
    expect(draft.value.slice(...draft.selection)).toBe("costs");
    const md = renameDraft("README.md");
    expect(md.value.slice(...md.selection)).toBe("README");
  });
});

describe("targetDir", () => {
  test("the cursor's folder, else the shown file's, else the root", () => {
    expect(targetDir({ path: "lib", kind: "dir" }, "main.squiggle")).toBe(
      "lib"
    );
    expect(targetDir({ path: "lib/a.squiggle", kind: "file" }, null)).toBe(
      "lib"
    );
    expect(targetDir(undefined, "text/notes.md")).toBe("text");
    expect(targetDir(undefined, null)).toBe("");
  });
});

describe("folder display", () => {
  test("home folders become ~", () => {
    expect(displayFolderPath("/Users/me/models")).toBe("~/models");
    expect(displayFolderPath("/home/me/")).toBe("~");
    expect(displayFolderPath("/tmp/x")).toBe("/tmp/x");
  });

  test("name and parent", () => {
    expect(folderName("/Users/me/work/models/")).toBe("models");
    expect(folderParent("/Users/me/work/models")).toBe("~/work");
    expect(folderParent("/models")).toBe("/");
  });
});

describe("treeKeyCommand", () => {
  const key = (
    k: string,
    mods: Partial<Record<"meta" | "ctrl" | "alt" | "shift", boolean>> = {}
  ) => ({
    key: k,
    code: "",
    metaKey: mods.meta ?? false,
    ctrlKey: mods.ctrl ?? false,
    altKey: mods.alt ?? false,
    shiftKey: mods.shift ?? false,
  });

  test.each([
    ["ArrowDown", "list.focusDown"],
    ["ArrowUp", "list.focusUp"],
    ["ArrowRight", "list.expand"],
    ["ArrowLeft", "list.collapse"],
    ["Home", "list.focusFirst"],
    ["End", "list.focusLast"],
    ["PageDown", "list.focusPageDown"],
    ["PageUp", "list.focusPageUp"],
    ["Enter", "explorer.openAndPassFocus"],
    [" ", "filesExplorer.openFilePreserveFocus"],
    ["Escape", "squiggle.focusMain"],
  ])("%j → %s", (k, id) => {
    expect(treeKeyCommand(key(k), "mac", "web")?.id).toBe(id);
    expect(treeKeyCommand(key(k), "win", "web")?.id).toBe(id);
  });

  test("⌘↓ opens on macOS only", () => {
    expect(
      treeKeyCommand(key("ArrowDown", { meta: true }), "mac", "web")?.id
    ).toBe("explorer.openAndPassFocus");
    expect(
      treeKeyCommand(key("ArrowDown", { meta: true }), "win", "web")
    ).toBeUndefined();
  });

  test("modified and other keys are left alone", () => {
    expect(
      treeKeyCommand(key("ArrowDown", { shift: true }), "mac", "web")
    ).toBeUndefined();
    expect(treeKeyCommand(key("a"), "mac", "web")).toBeUndefined();
    expect(treeKeyCommand(key("F2"), "mac", "web")).toBeUndefined(); // the dispatcher's
    expect(treeKeyCommand(key("Shift"), "mac", "web")).toBeUndefined();
  });

  test("list.focusUp/Down are repeatable, Enter isn't", () => {
    expect(
      treeKeyCommand(key("ArrowDown"), "mac", "web")?.spec.repeatable
    ).toBe(true);
    expect(
      treeKeyCommand(key("Enter"), "mac", "web")?.spec.repeatable
    ).toBeFalsy();
  });
});
