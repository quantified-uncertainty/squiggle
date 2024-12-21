import { makeCodec } from "../src/index.js";

// This test doubles as an example of how to use the serializer.

/*
 * First, let's define some example classes that we want to serialize and deserialize.
 *
 * The code for serializing and deserializing these is in `makeCodec` definition below.
 */

/*
 * First, a trivial class.
 * The only thing that we need to do with it it to convert it to a plain object.
 */
class Basic {
  // This is a marker property so that { x: 1 } is not allowed in place of Basic(1).
  public _tag = "BASIC" as const;

  constructor(public x: number) {}
}

/*
 * Each class has a serialized form.
 * Serialized types must be plain JSON types, i.e. they must not contain any classes or functions.
 */
type SerializedBasic = {
  x: number;
};

/*
 * Second, a class that references other classes.
 * The codec definition below will demonstrate how to recurse into other types with `visitor`.
 */
class Ref {
  public _tag = "REF" as const;

  constructor(
    public y: string,
    public value: Basic
  ) {}
}

type SerializedRef = {
  y: string;
  // This assumes that you know the type of the reference.
  // The example for polymorphic references is in the next class, `Deep`.
  basicId: number;
};

/**
 * What if we want to serialize a tree of objects, where each object may be of a different type?
 */
class Deep {
  public _tag = "DEEP" as const;

  constructor(
    public x: number,
    public value: Deep | Basic
  ) {}
}

type SerializedDeep = {
  x: number;
  kind: "deep" | "basic";
  valueId: number;
};

/*
 * Let's define the shape of the serialization.
 *
 * This type is essential; it describes the mapping between classes and their serialized forms on type level.
 *
 * All other types are derived from it, and most of the time you'll just be defining this shape.
 */
type TestShape = {
  basic: [Basic, SerializedBasic];
  ref: [Ref, SerializedRef];
  deep: [Deep, SerializedDeep];
};

/*
 * Now we can define the codec.
 *
 * This type is an instance of the codec, and it's what you'll use to serialize and deserialize.
 */
const codec = makeCodec<TestShape>({
  basic: {
    serialize: (node) => ({ x: node.x }),
    deserialize: (serialized) => new Basic(serialized.x),
  },
  ref: {
    // Note that `node` and `visitor` types are correctly inferred when you define them inline in `makeCodec` call.
    serialize: (node, visitor) => ({
      y: node.y,
      basicId: visitor.basic(node.value),
    }),
    deserialize: (serialized, visitor) =>
      new Ref(serialized.y, visitor.basic(serialized.basicId)),
  },
  deep: {
    /*
     * In real-life code, you might prefer to put these functions on the class
     * itself (`serialize` as a method, and `deserialize` as a static method).
     *
     * To do this, you'd have to type `visitor` correctly.
     *
     * The correct type for serialization `visitor` is `SerializationVisitor<TestShape>`,
     * and for deserialization it's `DeserializationVisitor<TestShape>`.
     */
    serialize: (node, visitor) => ({
      x: node.x,
      kind: node.value instanceof Deep ? "deep" : "basic",
      valueId:
        node.value instanceof Deep
          ? visitor.deep(node.value)
          : visitor.basic(node.value as Basic),
    }),
    deserialize: (serialized, visitor) =>
      new Deep(
        serialized.x,
        serialized.kind === "deep"
          ? visitor.deep(serialized.valueId)
          : visitor.basic(serialized.valueId)
      ),
  },
});

test("basic example", () => {
  const serializer = codec.makeSerializer();

  const basic = new Basic(42);
  const ref = new Ref("hello", basic);

  const entrypoint = serializer.serialize("ref", ref);

  const bundle = serializer.getBundle();

  const deserializer = codec.makeDeserializer(bundle);

  // entrypoints include the type tag, so deserializer knows which type to deserialize
  const deserializedBar = deserializer.deserialize(entrypoint);

  expect(deserializedBar).toEqual(ref);
  expect(deserializedBar).not.toBe(ref);
});

test("multiple entrypoints", () => {
  const serializer = codec.makeSerializer();

  const basic1 = new Basic(42);
  const basic2 = new Basic(43);

  const entrypoint1 = serializer.serialize("basic", basic1);
  const entrypoint2 = serializer.serialize("basic", basic2);

  const bundle = serializer.getBundle();

  const deserializer = codec.makeDeserializer(bundle);

  const deserialized1 = deserializer.deserialize(entrypoint1);
  const deserialized2 = deserializer.deserialize(entrypoint2);

  expect(deserialized1).toEqual(basic1);
  expect(deserialized2).toEqual(basic2);
  expect(deserialized1).not.toBe(basic1);
  expect(deserialized2).not.toBe(basic2);
});

test("deduplication", () => {
  const serializer = codec.makeSerializer();

  const basic = new Basic(42);
  const ref1 = new Ref("hello", basic);
  const ref2 = new Ref("hello", basic);

  const entrypoint1 = serializer.serialize("ref", ref1);
  const entrypoint2 = serializer.serialize("ref", ref2);

  const bundle = serializer.getBundle();

  const deserializer = codec.makeDeserializer(bundle);

  const deserialized1 = deserializer.deserialize(entrypoint1);
  const deserialized2 = deserializer.deserialize(entrypoint2);

  // refs are not identical
  expect(deserialized1).not.toBe(deserialized2);
  // but their values (Basic instances) are identical because of deduplication
  expect(deserialized1.value).toBe(deserialized2.value);
});
