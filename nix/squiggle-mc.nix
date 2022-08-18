{ pkgs }:

rec {
  rust = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
  pkg = pkgs.rustPlatform.buildRustPackage {
    pname = "quri_squiggle_mc";
    version = "0.0.1";
    src = ../packages/mc;

    nativeBuildInputs = [ rust pkgs.wasm-bindgen-cli ];

    buildPhase = ''
      cargo build --lib --release --target=wasm32-unknown-unknown

      mkdir -p $out/pkg

      wasm-bindgen --target nodejs --out-dir $out/pkg target/wasm32-unknown-unknown/release/quri_squiggle_mc.wasm
    '';
    installPhase = "echo 'skipping installPhase'";

    cargoLock = {
      lockFile = ../packages/mc/Cargo.lock;
      outputHashes = {
        "kernel_density-0.0.2" = "sha256-pHh5p/AS+uopmPSaXK9rKHlmqS26qggXvf1TeitS430=";
      };
    };
  };
  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-mc-lint";
    src = ../packages/mc;
    buildInputs = with pkgs; [ rustfmt ];
    buildPhase = "rustfmt --check src";
    installPhase = "mkdir -p $out";
  };

  test = pkgs.stdenv.mkDerivation {
    name = "squiggle-mc-test";
    src = pkg + "/pkg";
    buildInputs = with pkgs; [ cargo ];
    buildPhase = "cargo test";
    installPhase = "mkdir -p $out";
  };
}
