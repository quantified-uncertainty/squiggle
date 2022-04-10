To interface your library there only 2 files to be modified:

- Reducer/ReducerInterface/ReducerInterface_ExpressionValue.res

  This is where your additional types are referred for the dispatcher.

- Reducer/ReducerInterface/ReducerInterface_ExternalLibrary.res

  This is where dispatching to your library is done. If the dispatcher becomes beastly then feel free to divide it into submodules.

The Reducer is built to use different external libraries as well as different external parsers. Both external parsers and external libraries are plugins.

And finally try using Reducer.eval to how your extentions look:

```rescript
  test("1+2", () => expectEvalToBe( "1+2", "Ok(3)"))
```
