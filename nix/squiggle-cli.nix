{ pkgs, commonFn }:

rec {
  common = commonFn pkgs;

  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-cli-lint";
    buildInputs = common.buildInputs ++ common.prettier;
    src = ../packages/cli;
    buildPhase = "prettier --check .";
    installPhase = "mkdir -p $out";
  };
}
