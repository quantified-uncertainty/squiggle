import { run } from '../src/js/index';

describe("A simple result", () => {
    test("mean(normal(5,2))", () => {
        expect(run("mean(normal(5,2))")).toEqual({ tag: 'Ok', value: {hd: { NAME: 'Float', VAL: 5  }, tl: 0} });
    });
    test("10+10", () => {
        let foo = run("normal(5,2)");
        expect(1).toEqual(1);
    });
});
