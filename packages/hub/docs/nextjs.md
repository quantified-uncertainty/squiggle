# Notes on Next.js

## Loading pages

Avoid generic `loading.tsx` files. Thoughtful loading states are good, but the generic top-level loading state was harmful:

- it doesn't match the final rendered state so it looks more like a flash of unrelated content than a skeleton
- loading state means that the previous page will disappear faster than necessary, and that's bad; in other words, the loading state is only useful when it hints where the content will appear
- in addition, the loading state means that `<Link>` prefetching won't work

Avoid nested `loading.tsx` files. I'm not sure why but they might cause double flash of loading states, similar to this thread: https://www.reddit.com/r/nextjs/comments/17hn1a5/nested_loading_states/
