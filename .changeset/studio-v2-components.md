---
"@quri/squiggle-components": minor
---

Editor bridge for apps that embed `CodeEditor`:

- `CodeEditorHandle` gains `focus()`, `applyExternalChange(code)` (takes code written by another program in place, as one remote transaction outside the undo history, so the cursor, selection, scroll and the user's undo history survive), `getState()` and `getSelection()`.
- `CodeEditorProps.initialState` restores a state saved with `getState()` (undo history, selection and scroll); code changed meanwhile is applied as an external change.
- `runEditorCommand(target, "undo" | "redo" | "selectAll" | "find" | "replace" | "toggleComment" | "format")` runs an editor command on the editor that contains `target`, with this package's own CodeMirror, so apps don't need to import `@codemirror/*`.
- `editorClipboardText(target)`, `deleteEditorClipboardRanges(target)` and `pasteIntoEditor(target, text)` let an app's own Edit ▸ Cut, Copy and Paste edit the editor through the async clipboard API (`document.execCommand` can't edit CodeMirror, which edits through EditContext in Chrome). With nothing selected, Copy and Cut take the whole line, as CodeMirror's own copy does.
- Every editor dispatches a bubbling `sq-editor-cursor` event (`{line, column, selected, fromLine, toLine}`) when its cursor moves (`cursorEventExtension`, `SQ_EDITOR_CURSOR_EVENT`).
- `EditorStateSnapshot`, `ExternalViewerActions` and `ViewerWithMenuBarHandle` are exported.
- Long value titles are truncated with an ellipsis and a tooltip instead of overlapping themselves, and value headers carry `data-value-path`.
- Editor views are now destroyed on unmount.
- Gutter markers (the dots that reveal a value) now show for every visible top-level variable, not only the first.
- Text contrast of at least 4.5:1, also on a hovered value header: line numbers (darker still on the active line), value previews (types, counts, the distribution "to", strings, functions), the simulation indicator, the search panel's close button and the relative values cells' range and uncertainty colours are darker.
