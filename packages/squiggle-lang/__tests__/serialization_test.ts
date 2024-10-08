import { SampleSetDist } from "../src/dists/SampleSetDist/index.js";
import { run } from "../src/run.js";
import { squiggleCodec } from "../src/serialization/squiggle.js";
import { isEqual, Value, vBool, vDist, vString } from "../src/value/index.js";
import { vNumber } from "../src/value/VNumber.js";

function serializeAndDeserialize(value: Value) {
  const serializer = squiggleCodec.makeSerializer();
  const entrypoint = serializer.serialize("value", value);

  const deserializer = squiggleCodec.makeDeserializer(serializer.getBundle());
  return deserializer.deserialize(entrypoint);
}

function testEqualAfterSerialization(value: Value) {
  const value2 = serializeAndDeserialize(value);

  expect(isEqual(value, value2)).toBe(true);
}

describe("Serialization tests", () => {
  test("numbers", () => {
    testEqualAfterSerialization(vNumber(5));
  });
  test("string", () => {
    testEqualAfterSerialization(vString("foo"));
  });
  test("bool", () => {
    testEqualAfterSerialization(vBool(true));
  });
  test("sample set", () => {
    testEqualAfterSerialization(
      vDist(SampleSetDist.make([3, 1, 4, 1, 5, 9, 2, 6]).value as any)
    );
  });

  test("lambda", async () => {
    const bindings = (
      await run(`runTest() = {
  t = 1
  3
}`)
    ).getBindings();
    if (!bindings.ok) {
      throw bindings.value;
    }

    const lambda = bindings.value.get("runTest");
    if (!lambda) {
      throw new Error("No lambda");
    }
    const lambda2 = serializeAndDeserialize(lambda?._value);
    expect(lambda2).toBeDefined();
  });

  test("with tags", () => {
    let value = vNumber(5);
    value = value.mergeTags({ name: vString("five") });
    const value2 = serializeAndDeserialize(value);

    expect(isEqual(value, value2)).toBe(true);
    expect(value2.tags).toBeDefined();
    expect(value.tags?.name()).toEqual(value2.tags?.name());
  });
});
