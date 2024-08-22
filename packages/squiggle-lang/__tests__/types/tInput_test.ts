import { tInput } from "../../src/types/index.js";
import { FormInput, vInput } from "../../src/value/VInput.js";

test("pack/unpack", () => {
  const input: FormInput = { name: "first", type: "text" };
  const value = vInput(input);
  expect(tInput.unpack(value)).toBe(input);
  expect(tInput.pack(input)).toEqual(value);
});
