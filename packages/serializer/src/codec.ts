import {
  DeserializationStore,
  DeserializationVisitor,
} from "./deserialization.js";
import { SerializationStore, SerializationVisitor } from "./serialization.js";
import { BaseShape, Bundle, Entity, SerializedEntity } from "./types.js";

// This type describes a single entry in CodecConfig.
export type EntityCodec<
  Shape extends BaseShape,
  EntityType extends keyof Shape,
> = {
  serialize: (
    node: Entity<Shape, EntityType>,
    visitor: SerializationVisitor<Shape>
  ) => SerializedEntity<Shape, EntityType>;
  deserialize: (
    serializedNode: SerializedEntity<Shape, EntityType>,
    visitor: DeserializationVisitor<Shape>
  ) => Entity<Shape, EntityType>;
};

export type CodecConfig<Shape extends BaseShape> = {
  [EntityType in keyof Shape]: EntityCodec<Shape, EntityType>;
};

type Codec<Shape extends BaseShape> = {
  makeSerializer: () => SerializationStore<Shape>;
  makeDeserializer: (bundle: Bundle<Shape>) => DeserializationStore<Shape>;
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
