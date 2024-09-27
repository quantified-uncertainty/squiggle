# @quri/serializer

This package implements a generic serialization system for JavaScript objects.

Features:

- type-safe
- supports mixed data types
- can serialize any DAG (directed acyclic graph) and deduplicate values
- can serialize multiple values in a single bundle, and deserialize them back based on "entrypoints" to that bundle

# Terminology

## Entity

"Entity" is a kind of data that can be serialized and deserialized (e.g. "value", "ast" or "ir" for Squiggle); one multi-type codec can handle multiple entities.

Entity instances are also called "nodes".

For example, if you want to serialize this class:

```typescript
class Foo {
  constructor(public value: number) {}
}
```

Then we can say that your coder (see below) supports an entity of type "Foo".

Each entity is associated with two TypeScript types:

1. The original type of data, often a JavaScript class (`Foo` in the example).
2. The serialized type (subset of `JsonValue`), something like `{ value: number }`.

The serialized type will usually have the similar shape as the JS class, but all references to other nodes should be replaced by numbers.

For example, if you have another class,

```typescript
class Bar {
  constructor(public foo: Foo) {}
}
```

Then its serialized form should be something like `{ fooId: number }`.

You're responsible for defining two functions, "serializer" and "deserializer".

## Entity type

A single codec can encode and decode multiple entity types. To distinguish between them, we refer to them by names.

In most API methods, you have to pass the entity name explicitly to serialize it or to recurse into it through `visitor`.

## Node

"Node" is an instance of some entity type.

By convention, you can call a value that you serialize a "node", and values that you deserialize "serializedNode".

We use "node" instead of "value" to avoid confusion with the "value" entity type in squiggle-lang. Nodes can refer to other nodes, and generally form a directed graph; so "node" name is appropriate here.

## Visitors

Serializer and deserializer functions accept two parameters: an object that must be serialized/deserialized, and a visitor callback.

You can use visitor callbacks to recurse into node references.

## Codecs

The entire serializer/deserializer configuration is called a "codec".

When you define a codec through `makeCodec` function, you're responsible for defining two functions for each entity type, "serializer" and "deserializer".

A single codec can support multiple entity types, so a single codec should usually be enough for your entire project.

Example:

```typescript
const myCodec = makeCodec<{
  // entity name => pair of original node type and serialized node type
  foo: [Foo, { value: number }];
  bar: [Bar, { fooId: number }];
}>({
  foo: {
    // all types for nodes and visitors should be correctly defined from the type configuration given as a type parameter above
    serialize: (node) => ({ value: node.value }),
    deserialize: (node) => new Foo(node.value),
  },
  bar: {
    serialize: (node, visitor) => ({ fooId: visitor.foo(node.foo) }),
    deserialize: (node, visitor) => new Bar(visitor.foo(node.foo)),
  },
});
```

## Bundle

Bundle is a JSON-serializable object that contains serialized values.

Bundle format should be treated as a blackbox; it deduplicates node references and identifies them by ids, so it's not designed to be human-readable.

## Entrypoint

Entrypoints are references to some serialized entity in a bundle.

When you add a value to a bundle with `serializer.serialize(entityType, value)`, you get back an entrypoint that you can use later to restore the value.

## Serializer and deserializer objects; full usage example

You define serializer and deserializer functions when you describe the codec for your data types.

To use the codec, you will obtain serializer and deserializer _stores_, and then use those.

Serialization example:

```typescript
const serializer = codec.makeSerializer();

const entrypoint = serializer.serialize("foo", foo);

const bundle = serializer.getBundle();
// Both entrypoint and bundle are JSON-serializable, so you can store them in the database, send over HTTP, or return from the WebWorker.
```

Deserialization example:

```typescript
const deserializer = codec.makeDeserializer(bundle);

const foo = deserializer.deserialize(entrypoint);
```

# Applications

## Squiggle

This package is used in [Squiggle](https://www.squiggle-language.com) to serialize values. This is essential for marshaling values to and from Web Workers, and also for persisting Squiggle outputs to the database.
