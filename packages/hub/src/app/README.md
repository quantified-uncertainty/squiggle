Next.js app router root.

Conventions:

- store single use components in this folder, next to their `page.tsx` and `layout.tsx`
- if the component is shared between multiple pages, store it in `src/{topic}/components`, where `{topic}` is something like "models" or "relative-values"
- if the component doesn't have an obvious topic, e.g. if it's a generic UI component, store it in `src/components`
