{ pkgs, wasmPkgs, commonFn, naerskFn }:

rec {
  common = commonFn pkgs;

  rustVersion = "1.61.0";
  wasmTarget = "wasm32-unknown-unknown";
  rust = pkgs.rust-bin.stable.${rustVersion}.default.override {
    targets = [ wasmTarget ];
  };
  naersk = naerskFn { inherit pkgs rust; };
  mc-pkg = naersk.buildPackage {
    src = ../packages/mc;
    copyLibs = true;
    copyBins = true;
    CARGO_BUILD_TARGET = wasmTarget;
    nativeBuildInputs = common.buildInputs;
  };
  lib2 = mc-pkg;

  rustPkgsWasm = wasmPkgs.rustBuilder.makePackageSet {
    rustVersion = rustVersion;
    packageFun = import ../packages/mc/Cargo.nix;
    target = wasmTarget;
  };
  lib = (rustPkgsWasm.workspace.quri-squiggle-mc { }).out;

  yarn-source = pkgs.mkYarnPackage {
    name = "squiggle-mc_yarnsource";
    buildInputs = common.buildInputs;
    src = ../packages/mc;
    packageJSON = ../packages/mc/package.json;
    yarnLock = ../yarn.lock;
  };
  rust-lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-mc-lint";
    src = yarn-source + "/libexec/@quri/squiggle-mc/deps/@quri/squiggle-mc";
    buildInputs = with pkgs; [ rustfmt ];
    buildPhase = "rustfmt --check src";
    installPhase = "mkdir -p $out";
  };
  webpack-build-pkg = pkgs.stdenv.mkDerivation {
    name = "squiggle-mc-build";
    src = yarn-source + "/libexec/@quri/squiggle-mc";
    buildInputs = common.buildInputs ++ (with pkgs; [ wasm-pack ]);
    buildPhase = ''
      pushd deps/@quri/squiggle-mc
      sed -i /pkg/d .gitignore
      yarn --offline build
      popd
    '';
    installPhase = ''
      mkdir -p $out
      cp -r deps/@quri/squiggle-mc/. $out
    '';
  };
  firefox-test = pkgs.stdenv.mkDerivation {
    name = "squiggle-mc-test";
    src = yarn-source + "/libexec/@quri/squiggle-mc/deps/@quri/squiggle-mc";
    buildInputs = common.buildInputs ++ (with pkgs; [ geckodriver cargo wasm-pack ]);
    buildPhase = "yarn --offline test -- --firefox";
    installPhase = "mkdir -p $out";
  };
}
