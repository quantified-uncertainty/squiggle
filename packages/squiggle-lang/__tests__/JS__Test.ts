import { run } from '../src/js/index';

let testRun = (x: string) => {
  let result = run(x)
  if(result.tag == 'Ok'){
    return { tag: 'Ok', value: result.value.exports }
  }
  else {
    return result
  }
}

describe("A simple result", () => {
    test("mean(normal(5,2))", () => {
        expect(testRun("mean(normal(5,2))")).toEqual({ tag: 'Ok', value: [ { NAME: 'Float', VAL: 5  } ] })
    })
    test("10+10", () => {
        let foo = testRun("10 + 10")
        expect(foo).toEqual({ tag: 'Ok', value: [ { NAME: 'Float', VAL: 20  } ] })
    })
    test("log(1) = 0", () => {
      let foo = testRun("log(1)")
      expect(foo).toEqual({ tag: 'Ok', value: [ { NAME: 'Float', VAL: 0} ]})
    })
    test("mm(0,0,[0,0,0])", () => {
      let foo = testRun("mm(0,0,[0,0,0])")
      expect(foo).toEqual({ "tag": "Error", "value": "Function multimodal error: Too many weights provided" })
    })
});
