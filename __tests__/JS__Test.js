var js = require("../src/js/index.js");

describe("A simple result", () => {
    test("mean(normal(5,2))", () => {
        expect(js.eval("mean(normal(5,2))")).toEqual({ tag: 'Ok', value: { hd: { NAME: 'Float', VAL: 5 }, tl: 0 } });
    });
    test("10+10", () => {
        let foo = js.eval("normal(5,2)");
        console.log(foo.value.hd.VAL)
        expect(1).toEqual(1);
    });
});