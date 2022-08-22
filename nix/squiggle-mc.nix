{ pkgs }:

rec {
  rust = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
  pkg = pkgs.rustPlatform.buildRustPackage {
    pname = "quri_squiggle_mc";
    version = "0.0.1";
    src = ../packages/mc;
    nativeBuildInputs = with pkgs; [ rust wasm-bindgen-cli wasm-pack binaryen ];
    buildPhase = ''
      wasm-pack build --release --target nodejs
    '';
    installPhase = ''
      mkdir -p $out
      # sed -i /"quri_squiggle_mc"/"\@quri/squiggle-mc" pkg/package.json
      cp -r pkg $out
    '';
    cargoLock = {
      lockFile = ../packages/mc/Cargo.lock;
      outputHashes = {
        "kernel_density-0.0.3" = "sha256-ii+j30I4m1ZSvdMwEckiJOrenU8MZYYlo5PP1UZN4lI=";
      };
    };
  };
  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-mc-lint";
    src = ../packages/mc;
    buildInputs = with pkgs; [ cargo rustfmt ];
    buildPhase = "cargo fmt --check";
    installPhase = "mkdir -p $out";
  };

  test = pkgs.stdenv.mkDerivation {
    name = "squiggle-mc-test";
    src = pkg + "/pkg";
    buildInputs = with pkgs; [ wasm-pack geckodriver ];
    buildPhase = "wasm-pack test --firefox";
    installPhase = "mkdir -p $out";
  };
}
