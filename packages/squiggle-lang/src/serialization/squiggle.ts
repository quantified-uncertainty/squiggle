import {
  deserializeAstNode,
  serializeAstNode,
  SerializedASTNode,
} from "../ast/serialize.js";
import {
  deserializeIR,
  SerializedIR,
  serializeIR,
} from "../compiler/serialize.js";
import { IR } from "../compiler/types.js";
import { ASTNode } from "../index.js";
import { Lambda } from "../reducer/lambda/index.js";
import { RunProfile, SerializedRunProfile } from "../reducer/RunProfile.js";
import { deserializeValue } from "../value/deserializeValue.js";
import { SerializedValue, Value } from "../value/index.js";
import { SerializedValueTags, ValueTags } from "../value/valueTags.js";
import { deserializeLambda } from "./deserializeLambda.js";
import {
  Bundle,
  BundleEntrypoint,
  DeserializationStore,
  DeserializationVisitor,
  SerializationStore,
  SerializationVisitor,
  StoreConfig,
} from "./index.js";
import { SerializedLambda, serializeLambda } from "./serializeLambda.js";

// BaseShape for Squiggle.
type SquiggleShape = {
  value: [Value, SerializedValue];
  ir: [IR, SerializedIR];
  lambda: [Lambda, SerializedLambda];
  tags: [ValueTags, SerializedValueTags];
  profile: [RunProfile, SerializedRunProfile];
  ast: [ASTNode, SerializedASTNode];
};

const squiggleConfig: StoreConfig<SquiggleShape> = {
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
  // TODO - we should serialize AST nodes too, otherwise serialized lambdas could blow up in size, in some cases
};

export type SquiggleBundle = Bundle<SquiggleShape>;

export class SquiggleSerializationStore extends SerializationStore<SquiggleShape> {
  constructor() {
    super(squiggleConfig);
  }
}

class SquiggleDeserializationStore extends DeserializationStore<SquiggleShape> {
  constructor(bundle: SquiggleBundle) {
    super(bundle, squiggleConfig);
  }
}

export type SquiggleSerializationVisitor = SerializationVisitor<SquiggleShape>;

export type SquiggleDeserializationVisitor =
  DeserializationVisitor<SquiggleShape>;

export type SquiggleBundleEntrypoint<T extends keyof SquiggleShape> =
  BundleEntrypoint<SquiggleShape, T>;

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
export const squiggleCodec = {
  makeSerializer: () => new SquiggleSerializationStore(),
  makeDeserializer: (bundle: SquiggleBundle) =>
    new SquiggleDeserializationStore(bundle),
};
