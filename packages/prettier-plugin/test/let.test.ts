import { format } from "./helpers.js";

describe("let", () => {
  test("simple", async () => {
    expect(await format("x = 5")).toBe("x = 5\n");
  });

  test("expression", async () => {
    expect(await format("x=5+6")).toBe("x = 5 + 6\n");
  });

  test("defun", async () => {
    expect(await format("f(x)=x*x")).toBe("f(x) = x * x\n");
  });

  test("defun with multiple args", async () => {
    expect(await format("f(x,y)=x*y")).toBe("f(x, y) = x * y\n");
  });

  test("defun with long args args", async () => {
    expect(
      await format(
        "f(yaewrtawieyra,auweyrauweyrauwyer,wekuryakwueyruaweyr,wekuryakwueyruaweyr,wekuryakwueyruaweyr)=x*y"
      )
    ).toBe(`f(
  yaewrtawieyra,
  auweyrauweyrauwyer,
  wekuryakwueyruaweyr,
  wekuryakwueyruaweyr,
  wekuryakwueyruaweyr
) = x * y
`);
  });
});
