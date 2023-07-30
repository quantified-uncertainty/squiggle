# How to load GraphQL data in Next.js pages

Based on https://github.com/relayjs/relay-examples/tree/main/issue-tracker-next-v13.

For any new page that needs GraphQL data you'll need two files:

1. `page.tsx` (usual Next.js page file)
2. `MyPage.tsx` (gobally unique semantic name, like `ModelPage` or `DefinitionPage`)

## page.tsx

**Don't** put `"use client"` in `page.tsx`; it should an RSC.

Call `loadSerializableQuery` to get a query:

```typescript
// Generated based on a query definition from `MyPage.tsx` by `relay-compiler`.
// You don't have to rename `MyPageQuery` type, but this pattern will be copy-pasted in all pages,
// so it's nice to have the identical type and var names in the following code.
// (There's almost always only a single query per page, so there's no risk of name collisions.)
import QueryNode, { MyPageQuery as QueryType } from  from "@/__generated__/MyPageQuery.graphql";

export default async function Page() {
  const query = await loadSerializableQuery<typeof QueryNode, QueryType>(QueryNode.params, {
    ... // query variables
  });

  return <MyPage query={query} />;
}
```

## MyPage.tsx

`MyPage` component must have `"use client"` declaration on top.

It should contain:

1. GraphQL query, like this:

```typescript
// In Relay, query name ("MyPageQuery") must match the file name ("MyPage").
// So we store this definition here and not in `page.tsx`.
const Query = graphql`
  query MyPageQuery {
    myField {
      ...
    }
  }
`;
```

2. A React component that takes a serializable query as a parameter:

```typescript
// Same import as in `page.tsx`.
import QueryNode, { MyPageQuery as QueryType } from  from "@/__generated__/MyPageQuery.graphql";

export const MyPage: FC<{
  query: SerializablePreloadedQuery<typeof QueryNode, QueryType>;
}> = ({ query }) => {
  const queryRef = useSerializablePreloadedQuery(query);
  const { myField: result } = usePreloadedQuery(Query, queryRef);

  ...
}
```

# Notes

- If you use `useLazyLoadQuery` instead of this pattern, the performance will be worse
- It's ok to use `useLazyLoadQuery` in the components that render on demand (e.g. data that shows when you open a dropdown)
- If you need to load GraphQL data in the Next.js layout, use `layout.tsx` and `MyLayout.tsx`; everything else should be the same
