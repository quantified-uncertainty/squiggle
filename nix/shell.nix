{ pkgs }:
with pkgs; {
  shell = mkShell {
    name = "SQUIGGLE_yarn-wasm-devshell";
    buildInputs = [
      wasm-pack
      cargo
      yarn
      nodejs
      nodePackages.ts-node
      rustup
      pkg-config
      libressl
      nixfmt
      rustfmt
      wasmtime
      binaryen
      wasm-bindgen-cli
    ];
  };
}
