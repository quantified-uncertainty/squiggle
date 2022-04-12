# Properties

Using `nix`. Where `o` is `open` on OSX and `xdg-open` on linux, 
```sh
nix-build
o result/properties.pdf
```
Without `nix`, you can install `pandoc` yourself and run
```sh
pandoc --from markdown --to latex --out properties.pdf --pdf-engine xelatex properties.md
```

## _Details_

The `properties.pdf` document is _normative and aspirational_. It does not document tests as they exist in the codebase, but somewhat represents how we think squiggle ought to be tested. 