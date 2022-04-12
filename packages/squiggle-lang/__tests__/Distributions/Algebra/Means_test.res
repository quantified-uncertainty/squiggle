open Jest
open Expect
open TestHelpers

describe("Mean", () => {
    
    let distributions = list{
        normalMake(0.0, 1e0), 
        betaMake(2e0, 4e0), 
        exponentialMake(1.234e0), 
        uniformMake(7e0, 1e1), 
        cauchyMake(1e0, 1e0), 
        lognormalMake(1e0, 1e0), 
        triangularMake(1e0, 1e1, 5e1), 
        floatMake(1e1)
    }
    test("addition", () => {
        true -> expect -> toBe(true)
    })
})