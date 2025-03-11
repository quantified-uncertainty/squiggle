# Notes on Next.js conventions

## Component files

- store single use components in `src/app`, next to their `page.tsx` and `layout.tsx`
- if the component is shared between multiple pages, store it in `src/{topic}/components/`, where `{topic}` is something like "models" or "relative-values"
- if the component doesn't have an obvious topic, e.g. if it's a generic UI component, store it in `src/components/`

## Actions

- store actions in `src/{topic}/actions/`, where `{topic}` is something like "models" or "relative-values"
- name actions like this: `doSomethingAction`
- use `next-safe-action` to define all actions
- return _something_ from actions, even if it's just `"ok"`; some wrappers check whether `data` on the action is defined

## Data loading

- all data loading functions that expose data to the frontend should go in `src/{topic}/data/`
- data loading functions should sanitize the data that they select from the database, to avoid security issues

## Loading pages

Avoid generic `loading.tsx` files. Thoughtful loading states are good, but the generic top-level loading state was harmful:

- it doesn't match the final rendered state so it looks more like a flash of unrelated content than a skeleton
- loading state means that the previous page will disappear faster than necessary, and that's bad; in other words, the loading state is only useful when it hints where the content will appear
- in addition, the loading state means that `<Link>` prefetching won't work

Avoid nested `loading.tsx` files. I'm not sure why but they might cause double flash of loading states, similar to this thread: https://www.reddit.com/r/nextjs/comments/17hn1a5/nested_loading_states/

## Components

Use `@quri/ui` components for icons and buttons.

Use `react-hook-form` for form handling, usually combined with `next-safe-action` for server actions.

Always use our custom `<Link>` component from `src/components/ui`, instead of the native Next.js `<Link>` component.

Use `useToast` from `@quri/ui` for displaying notifications and errors.
