# Properties

Using `nix`. Where `o` is `open` on OSX and `xdg-open` on linux, 

```sh
nix-build
o result/property-tests.pdf
```

Without `nix`, you can install `pandoc` and `pdflatex` yourself and see `make.sh` for the rendering command. 

## _Details_

The `invariants.pdf` document is _normative and aspirational_. It does not document tests as they exist in the codebase, but represents how we think squiggle ought to be tested. 

We are partially bottlenecked by the rescript ecosystem's maturity with respect to property-based testing. 
