import { Expression } from "../expression/index.js";
import {
  deserializeExpression,
  SerializedExpression,
  serializeExpression,
} from "../expression/serialize.js";
import { Lambda } from "../reducer/lambda.js";
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
  expression: [Expression, SerializedExpression];
  lambda: [Lambda, SerializedLambda];
  tags: [ValueTags, SerializedValueTags];
};

const squiggleConfig: StoreConfig<SquiggleShape> = {
  value: {
    serialize: (node, visitor) => node.serialize(visitor),
    deserialize: (serializedNode, visitor) =>
      deserializeValue(serializedNode, visitor),
  },
  expression: {
    serialize: (node, visitor) => serializeExpression(node, visitor),
    deserialize: (serializedNode, visitor) =>
      deserializeExpression(serializedNode, visitor),
  },
  lambda: {
    serialize: (node, visitor) => serializeLambda(node, visitor),
    deserialize: (serializedNode, visitor) =>
      deserializeLambda(serializedNode, visitor),
  },
  tags: {
    serialize: (node, visitor) => node.serialize(visitor),
    deserialize: (serializedNode, visitor) =>
      ValueTags.deserialize(serializedNode, visitor),
  },
  // TODO - we should serialized AST nodes too, otherwise serialized lambdas could blow up in size, in some cases
};

export type SquiggleBundle = Bundle<SquiggleShape>;

class SquiggleSerializationStore extends SerializationStore<SquiggleShape> {
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
 * const entrypoint3 = serializer.serialize("expression", expression); // serialize an expression (or any other entity type that's supported)
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
