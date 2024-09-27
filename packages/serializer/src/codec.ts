// StoreConfig is the primary config for the multi-entity codec. See `squiggleConfig` in `./squiggle.ts` for how it's used.

import {
  DeserializationStore,
  DeserializationVisitor,
} from "./deserialization.js";
import { SerializationStore, SerializationVisitor } from "./serialization.js";
import { BaseShape, Bundle, Node, SerializedNode } from "./types.js";

// This config is used to describe how an entity type should be serialized and deserialized.
export type EntityCodec<
  Shape extends BaseShape,
  EntityType extends keyof Shape,
> = {
  serialize: (
    node: Node<Shape, EntityType>,
    visitor: SerializationVisitor<Shape>
  ) => SerializedNode<Shape, EntityType>;
  deserialize: (
    serializedNode: SerializedNode<Shape, EntityType>,
    visitor: DeserializationVisitor<Shape>
  ) => Node<Shape, EntityType>;
};

type Codec<Shape extends BaseShape> = {
  makeSerializer: () => SerializationStore<Shape>;
  makeDeserializer: (bundle: Bundle<Shape>) => DeserializationStore<Shape>;
};

// It will infer correct parameter types for `serialize` and `deserialize` methods, based on the `Shape` type.
export type StoreConfig<Shape extends BaseShape> = {
  [EntityType in keyof Shape]: EntityCodec<Shape, EntityType>;
};

export function makeCodec<Shape extends BaseShape>(
  config: StoreConfig<Shape>
): Codec<Shape> {
  return {
    makeSerializer: () => new SerializationStore(config),
    makeDeserializer: (bundle: Bundle<Shape>) =>
      new DeserializationStore(bundle, config),
  } satisfies Codec<Shape>;
}
