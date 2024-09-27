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

export type CodecConfig<Shape extends BaseShape> = {
  [EntityType in keyof Shape]: EntityCodec<Shape, EntityType>;
};

/*
 * CodecConfig is the primary config for the multi-entity codec.
 *
 * The usual way to create a codec is to call `makeCodec` with an explicit Shape type parameter, and pass the config object to it, inlined.
 *
 * Then it will infer correct parameter types for `serialize` and `deserialize` methods, based on the `Shape` type.
 *
 * See `serialization/squiggle.ts` in squiggle-lang for an example how to use this.
 */
export function makeCodec<Shape extends BaseShape>(
  config: CodecConfig<Shape>
): Codec<Shape> {
  return {
    makeSerializer: () => new SerializationStore(config),
    makeDeserializer: (bundle: Bundle<Shape>) =>
      new DeserializationStore(bundle, config),
  } satisfies Codec<Shape>;
}
