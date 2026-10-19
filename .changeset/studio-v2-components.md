---
"@quri/squiggle-components": minor
---

Editor bridge for apps that embed `CodeEditor`:

- `CodeEditorHandle` gains `focus()`, `applyExternalChange(code)` (takes code written by another program in place, as one remote transaction outside the undo history, so the cursor, selection, scroll and the user's undo history survive), `getState()` and `getSelection()`.
- `CodeEditorProps.initialState` restores a state saved with `getState()` (undo history, selection and scroll); code changed meanwhile is applied as an external change.
- `runEditorCommand(target, "undo" | "redo" | "selectAll" | "find" | "replace" | "toggleComment" | "format")` runs an editor command on the editor that contains `target`, with this package's own CodeMirror, so apps don't need to import `@codemirror/*`.
- Every editor dispatches a bubbling `sq-editor-cursor` event (`{line, column, selected}`) when its cursor moves (`cursorEventExtension`, `SQ_EDITOR_CURSOR_EVENT`).
- `EditorStateSnapshot`, `ExternalViewerActions` and `ViewerWithMenuBarHandle` are exported.
- Long value titles are truncated with an ellipsis and a tooltip instead of overlapping themselves, and value headers carry `data-value-path`.
- Editor views are now destroyed on unmount.
