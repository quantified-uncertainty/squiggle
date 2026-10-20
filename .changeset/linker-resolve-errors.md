---
"@quri/squiggle-lang": patch
---

An `SqLinker` whose `resolve` throws no longer breaks the project: the failure is reported as an import error at the import statement, like a failed `loadModule`. Previously the exception escaped `SqProject.setHead` and the run never finished. `SqModule.getImports` now returns a `result` that fails with these errors instead of throwing.
