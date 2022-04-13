open Jest
open Expect

describe("E.L.combinations2", () => {
    test("size three", () => {
        E.L.combinations2(list{"alice", "bob", "eve"}) -> expect -> toEqual(
            list{("alice", "bob"), ("alice", "eve"), ("bob", "eve")}
        )
    })
})