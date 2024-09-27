import {
  Bundle,
  BundleEntrypoint,
  DeserializationStore,
  DeserializationVisitor,
  makeCodec,
  SerializationStore,
  SerializationVisitor,
} from "@quri/serializer";

import {
  deserializeAstNode,
  serializeAstNode,
  SerializedASTNode,
} from "../ast/serialize.js";
import { ASTNode } from "../ast/types.js";
import {
  deserializeIR,
  SerializedIR,
  serializeIR,
} from "../compiler/serialize.js";
import { IR } from "../compiler/types.js";
import { FnInput, SerializedFnInput } from "../reducer/lambda/FnInput.js";
import { Lambda } from "../reducer/lambda/index.js";
import { RunProfile, SerializedRunProfile } from "../reducer/RunProfile.js";
import { deserializeType, SerializedType } from "../types/serialize.js";
import { Type } from "../types/Type.js";
import { deserializeValue } from "../value/deserializeValue.js";
import { SerializedValue, Value } from "../value/index.js";
import { SerializedValueTags, ValueTags } from "../value/valueTags.js";
import { deserializeLambda } from "./deserializeLambda.js";
import { SerializedLambda, serializeLambda } from "./serializeLambda.js";

/**
 * This is the main entrypoint for the entire serialization subsystem.
 *
 * How to use:
 * ```
 * const serializer = squiggleCodec.makeSerializer(); // make a serializer that contains a single bundle and can serialize multiple values
 *
 * // you can throw multiple things in the bundle, just don't forget to track the entrypoints
 * const entrypoint1 = serializer.serialize("value", myValue); // serialize a value
 * const entrypoint2 = serializer.serialize("value", myValue2); // serialize another value
 * const entrypoint3 = serializer.serialize("ir", ir); // serialize an IR node (or any other entity type that's supported)
 *
 * // get the bundle - it will contain everything that was serialized
 * const bundle = serializer.getBundle();
 *
 * // Now, both `bundle` and `entrypoint1`, `entrypoint2`, `entrypoint3` can be sent over the wire or saved to disk or database. They're just JSON objects.
 *
 * // On the other side, after you restore them:
 * const deserializer = squiggleCodec.makeDeserializer(bundle);
 * const myValue = deserializer.deserialize(entrypoint1);
 * // ... deserialize other values based on their entrypoints
 * ```
 *
 * Real-world usage examples can be found in `__tests__/serialization_test.ts` and in `EmbeddedWithSerializationRunner.ts`.
 */

// Serialization shape for Squiggle.
type SquiggleShape = {
  value: [Value, SerializedValue];
  ir: [IR, SerializedIR];
  lambda: [Lambda, SerializedLambda];
  tags: [ValueTags, SerializedValueTags];
  profile: [RunProfile, SerializedRunProfile];
  ast: [ASTNode, SerializedASTNode];
  type: [Type, SerializedType];
  input: [FnInput, SerializedFnInput];
};

/*
 * Main codec.
 *
 * Use `squiggleCodec.makeSerializer()` and `squiggleCodec.makeDeserializer()` to create serializers and deserializers.
 */
export const squiggleCodec = makeCodec<SquiggleShape>({
  value: {
    serialize: (node, visitor) => node.serialize(visitor),
    deserialize: deserializeValue,
  },
  ir: {
    serialize: serializeIR,
    deserialize: deserializeIR,
  },
  lambda: {
    serialize: serializeLambda,
    deserialize: deserializeLambda,
  },
  tags: {
    serialize: (node, visitor) => node.serialize(visitor),
    deserialize: ValueTags.deserialize,
  },
  profile: {
    serialize: (node) => node.serialize(),
    deserialize: RunProfile.deserialize,
  },
  ast: {
    serialize: serializeAstNode,
    deserialize: deserializeAstNode,
  },
  type: {
    serialize: (node, visitor) => node.serialize(visitor),
    deserialize: deserializeType,
  },
  input: {
    serialize: (node, visitor) => node.serialize(visitor),
    deserialize: FnInput.deserialize,
  },
});

export type SquiggleBundle = Bundle<SquiggleShape>;

export type SquiggleSerializationStore = SerializationStore<SquiggleShape>;
export type SquiggleDeserializationStore = DeserializationStore<SquiggleShape>;

export type SquiggleSerializationVisitor = SerializationVisitor<SquiggleShape>;

export type SquiggleDeserializationVisitor =
  DeserializationVisitor<SquiggleShape>;

export type SquiggleBundleEntrypoint<T extends keyof SquiggleShape> =
  BundleEntrypoint<SquiggleShape, T>;
