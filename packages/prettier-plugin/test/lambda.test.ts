import { format } from "./helpers.js";

describe("lambda", () => {
  test("lambda", async () => {
    expect(await format("f={|x|x*x}")).toBe("f = {|x|x * x}\n");
  });

  test("lambda with multiple args", async () => {
    expect(await format("f={|x,y|x*y}")).toBe("f = {|x, y|x * y}\n");
  });

  test("lambda with long body", async () => {
    expect(
      await format(
        "f={|x,y|yaewrtawieyra+auweyrauweyrauwyer+wekuryakwueyruaweyr+wekuryakwueyruaweyr+wekuryakwueyruaweyr}"
      )
    ).toBe(
      `f = {
  |x, y|
  yaewrtawieyra + auweyrauweyrauwyer + wekuryakwueyruaweyr +
    wekuryakwueyruaweyr +
    wekuryakwueyruaweyr
}\n`
    );
  });

  test("lambda with long parameters", async () => {
    expect(
      await format(
        "f={|yaewrtawieyra,auweyrauweyrauwyer,wekuryakwueyruaweyr,wekuryakwueyruaweyr,wekuryakwueyruaweyr|123}"
      )
    ).toBe(
      `f = {
  |
    yaewrtawieyra,
    auweyrauweyrauwyer,
    wekuryakwueyruaweyr,
    wekuryakwueyruaweyr,
    wekuryakwueyruaweyr
  |
  123
}
`
    );
  });

  test("unwrap body block", async () => {
    expect(
      await format(`f = {|x|
  a = x
  a
}`)
    ).toBe(`f = {
  |x|
  a = x
  a
}
`);
  });

  // https://github.com/quantified-uncertainty/squiggle/issues/2142
  test("dedent in body", async () => {
    expect(
      await format(
        `f = { |x| longlonglonglonglonglonglonglonglonglonglonglonglonglonglongName(foo, bar, baz) }`
      )
    ).toBe(`f = {
  |x|
  longlonglonglonglonglonglonglonglonglonglonglonglonglonglongName(
    foo,
    bar,
    baz
  )
}
`);
  });
});
