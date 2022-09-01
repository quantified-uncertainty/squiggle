{ pkgs }:
with pkgs;
let
  js = [ yarn nodejs nodePackages.ts-node ];
  rust = [
    wasm-pack
    cargo
    rustup
    pkg-config
    libressl
    rustfmt
    wasmtime
    binaryen
    wasm-bindgen-cli
  ];
in {
  all = mkShell {
    name = "squiggle_yarn-wasm-devshell";
    buildInputs = builtins.concatLists [ js rust [ nixfmt ] ];
  };
  just-js = mkShell {
    name = "squiggle_yarn-devshell";
    buildInputs = js ++ [ nixfmt ];
  };
}
