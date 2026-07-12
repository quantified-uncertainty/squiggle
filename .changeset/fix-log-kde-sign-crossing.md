---
"@quri/squiggle-lang": patch
---

Fix spurious density spikes near zero when rendering sign-crossing sample sets (e.g. the difference of two lognormals) — the log-KDE heuristic no longer fires on distributions that span both signs (#4103)
