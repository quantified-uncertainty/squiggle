module Bindings = Reducer_Category_Module
module Module = Reducer_Category_Module

let m =
  Module.emptyModule->Module.defineNumber("pi", Js.Math._PI)->Module.defineNumber("e", Js.Math._E)

let makeBindings = (previousBindings: Module.t): Module.t =>
  previousBindings->Bindings.defineModule("Math", m)
