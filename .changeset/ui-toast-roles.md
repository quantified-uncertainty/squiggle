---
"@quri/ui": patch
---

Toasts from `WithToasts` now have `role="alert"` (errors) or `role="status"` (confirmations), so screen readers announce them, plus `data-testid="toast"` and `data-toast-type` for end-to-end tests.
