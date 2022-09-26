# Function Registry

The function registry is a library for organizing function definitions.

The main interface is fairly constrained. Basically, write functions like the following, and add them to a big array.

```rescript
  Function.make(
    ~name="Normal",
    ~definitions=[
        FnDefinition.make(
            ~name="normal",
            ~inputs=[FRTypeDistOrNumber, FRTypeDistOrNumber],
            ~run=(
                inputs,
                env,
            ) =>
                inputs
                ->Prepare.ToValueTuple.twoDistOrNumber
                ->E.R.bind(
                Process.twoDistsOrNumbersToDistUsingSymbolicDist(
                    ~fn=E.Tuple2.toFnCall(SymbolicDist.Normal.make),
                    ~env,
                    ~values=_,
                ),
                )
                ->E.R2.fmap(Wrappers.evDistribution)
        )
    ],
  )
```

The Function name is just there for future documentation.

## Key Files

**FunctionRegistry_Core**
Key types, internal functionality, and a `Registry` module with a `call` function to call function definitions.

**FunctionRegistry_Library**
A list of all the Functions defined in the Function Registry.

The definition arrays are stored in `FR_*` modules, by convention.

**FunctionRegistry_Helpers**
A list of helper functions for the `FunctionRegistry_Library`.
