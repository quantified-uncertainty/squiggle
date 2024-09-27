# @quri/serializer

This package implements a generic serialization system for JavaScript objects.

Features:

- type-safe
- supports mixed data types
- can serialize any DAG (directed acyclic graph) and deduplicate values
- can serialize multiple values in a single bundle, and deserialize them back based on "entrypoints" to that bundle

# Terminology

## Entity

"Entity" is a type of data that can be serialized and deserialized (e.g. "value", "ir" for Squiggle); one multi-type codec can handle multiple entities.

## Node

"Node" is an instance of an entity type. I use "node" instead of "value" to avoid confusion with the "value" entity type.

## Bundle

"Bundle" is a JSON-serializable object that contains serialized values.

## Entrypoint

"Entrypoint" is a reference to a serialized value in a bundle. When you add a value to a bundle, you get an entrypoint that you can use to refer to this value later.

## Visitor

"Visitor" is an helper object that can serialize or deserialize nested nodes.

# Applications

## Squiggle

This package is used in [Squiggle](https://www.squiggle-language.com) to serialize values. This is essential for marshalling values to and from Web Workers, and also for persisting Squiggle outputs to the database.

To make things easier to understand, you can experiment with running Squiggle code with `embedded-with-serialization` runner and `PRINT_SERIALIZED_BUNDLE=1` enabled.

It will print a JSON-serialized bundle to the console.

Example: `PRINT_SERIALIZED_BUNDLE=1 pnpm --silent cli run -r embedded-with-serialization -e 'x=2+2;y=[x,x];z()=x'`
