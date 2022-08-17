{ pkgs }:

rec {
  rustPkgs = pkgs.rustBuilder.makePackageSet {
    rustVersion = "1.60.0";
    packageFun = import ./../packages/squiggle-mc-cached/Cargo.nix;
  };
  mc-cached = rustPkgs.workspace.squiggle-mc-cached-wasm {};
}
