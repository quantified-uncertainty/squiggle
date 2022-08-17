{ pkgs, cargo2nix }:
with pkgs; {
  shell = mkShell {
    name = "SQUIGGLE_yarn-wasm-devshell";
    buildInputs = [
      wasm-pack
      cargo
      yarn
      nodejs
      rustup
      pkg-config
      libressl
      nixfmt
      rustfmt
      cargo2nix.outputs.packages.${pkgs.system}.default
    ];
  };
}
