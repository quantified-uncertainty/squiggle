{ pkgs ? import <nixpkgs> {} }:

with pkgs;

mkShell {
  buildInputs = [
    wasm-pack
    cargo-generate
    nodePackages.npm
    rustup
    cargo
    pkg-config
    openssl
  ];
}
