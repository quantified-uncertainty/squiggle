# Properties

Using `nix`. Where `o` is `open` on OSX and `xdg-open` on linux, 

```sh
nix-build
o result/property-tests.pdf
```

Without `nix`, you can install `pandoc` yourself and run
```sh
pandoc -s property-tests.md -o property-tests.pdf
```

## _Details_

The `property-tests.pdf` document is _normative and aspirational_. It does not document tests as they exist in the codebase, but somewhat represents how we think squiggle ought to be tested. 
