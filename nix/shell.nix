{ pkgs }:
with pkgs; {
  shell = mkShell {
    name = "SQUIGGLE_yarn-wasm-devshell";
    buildInputs =
      [ wasm-pack cargo yarn nodejs rustup pkg-config openssl nixfmt rustfmt ];
  };
}
