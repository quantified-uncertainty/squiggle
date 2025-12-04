---
---

fix: Add pnpm override for Next.js to mitigate CVE-2025-55182

This is a workspace-level security fix that forces all Next.js resolutions
to use the patched ^15.2.4 version, addressing a critical RCE vulnerability
in React Server Components.
