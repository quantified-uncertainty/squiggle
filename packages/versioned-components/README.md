This package provides an API for using various versions on Squiggle in a type-safe manner.

It's used in Squiggle Hub and documentation website.

The two main entrypoints for this packages are:

1. `versionedSquigglePackages` async function that loads both `squiggle-lang` and `components` for a given version.
2. Feature checkers that act as [type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates), so that you could adjust your code for features that are supported only in recent versions.

# `versionedSquigglePackages`

If you're writing code for a modern Next.js app, e.g. Squiggle Hub, you can call [use](https://react.dev/reference/react/use):

```typescript
const squiggle = use(versionedSquigglePackages(version));
```

It will give you an object that contains `lang`, `components` and a `version` (identical to the version that you passed as a parameter).

Sometimes you might need to narrow `squiggle` type based on version; because of this, we recommend _not_ destructuring `squiggle` immediately. See `.object` feature checker below for an example.

React prop types on `squiggle.components` will be somewhat relaxed. It's technically possible to pass `SqProject` object (or some other value from `squiggle-lang`) for a wrong version. This is because of TypeScript limitations, the details are explained in [this Discord discussion](https://discord.com/channels/1130609991993274510/1133551706370752582/1199946151609237545).

# Feature checkers

We provide several feature checkers that can narrow versioned types that come from this package.

All these checkers start with `versionSupports`:

- `versionSupportsExports`
- `versionSupportsImportTooltip`
- `versionSupportsSqPathV2`
  etc.

Each checker is an object with several functions: `.plain`, `.object` and `.propsByVersion`. Depending on the task, one of these should be appropriate.

## `.plain`

`.plain` takes a version string (that must already be narrowed to `SquiggleVersion` type) and narrows it to a version string that supports the feature:

```typescript
const version: SquiggleVersion = ...; // Squiggle version as a plain string
if (versionSupportsExports.plain(version)) {
    // `version` is now limited to the types that support exports
}
```

## `.object`

`.object` takes an object that has a `version` property, typed as a discriminated union over that property, and filters union subtypes that support the given feature.

The most common use case is to use this for package objects obtained through `versionedSquigglePackages`>

```typescript
const squiggle = use(versionedSquigglePackages(version));
if (versionSupportsSqPathV2.object(squiggle)) {
  const path = squiggle.lang.SqValuePath({
    root: bindings,
    edges: [], // `edges` exist only for v2 paths, so this would fail without a checker
  });
}
```

## `.propsByVersion`

This checker allows you to check `props` that you're building for a component by a given `version` value.

```typescript
const squiggle = use(versionedSquigglePackages(version));

// Starting with the minimal set of props that's compatible with any SquigglePlayground version
const props: Parameters<typeof squiggle.components.SquigglePlayground>[0] = {
  defaultCode: "2+2",
};

if (
  // Note the explicit generic parameter; `propsByVersion` needs to know which props type it updates.
  versionSupportsExports.propsByVersion<"SquigglePlayground">(
    squiggle.version,
    props
  )
) {
  // `props` is now limited to props for `SquigglePlayground` versions taht support `onExportsChange`
  props.onExportsChange = (exports) => {
    form.setValue("exports", exports);
  };
}
```

Note that it's possible to lie to TypeScript with this checker. You could pass an incorrect `version` unrelated to `props` that you're constructing. But if everything comes from a single `squiggle` object that you obtained with `versionedSquigglePackages`, then your code will be safe.

## Writing new feature checkers

See `src/predicates.ts`
