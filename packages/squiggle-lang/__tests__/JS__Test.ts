import { run } from '../src/js/index';

describe("A simple result", () => {
    test("mean(normal(5,2))", () => {
        expect(run("mean(normal(5,2))")).toEqual({ tag: 'Ok', value: [ { NAME: 'Float', VAL: 5  } ] })
    })
    test("10+10", () => {
        let foo = run("10 + 10")
        expect(foo).toEqual({ tag: 'Ok', value: [ { NAME: 'Float', VAL: 20  } ] })
    })
    test("log(1) = 0", () => {
      let foo = run("log(1)")
      expect(foo).toEqual({ tag: 'Ok', value: [ { NAME: 'Float', VAL: 0} ]})
    })
    test("mm(0,0,[0,0,0])", () => {
      let foo = run("mm(0,0,[0,0,0])")
      expect(foo).toEqual({ "tag": "Error", "value": "Function multimodal error: Too many weights provided" })
    })
});
