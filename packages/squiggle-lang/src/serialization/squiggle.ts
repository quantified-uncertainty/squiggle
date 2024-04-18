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

export const squiggleCodec = {
  makeSerializer: () => new SquiggleSerializationStore(),
  makeDeserializer: (bundle: SquiggleBundle) =>
    new SquiggleDeserializationStore(bundle),
};
