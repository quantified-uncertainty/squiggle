{ pkgs, commonFn, gentypeOutputFn }:

rec {
  common = commonFn pkgs;
  langPackageJson = let
    raw = pkgs.lib.importJSON ../packages/squiggle-lang/package.json;
    modified = pkgs.lib.recursiveUpdate raw {
      devDependencies."@types/lodash" = "^4.14.167";
    };
    packageJsonString = builtins.toJSON modified;
  in pkgs.writeText "packages/squiggle-lang/patched-package.json"
  packageJsonString;
  yarn-source = pkgs.mkYarnPackage {
    name = "squiggle-lang_yarnsource";
    src = ../packages/squiggle-lang;
    packageJSON = langPackageJson;
    yarnLock = ../yarn.lock;
  };
  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-lang-lint";
    src = yarn-source + "/libexec/@quri/squiggle-lang/deps/@quri/squiggle-lang";
    buildInputs = common.buildInputs ++ common.prettier;
    buildPhase = ''
      yarn lint
    '';
    installPhase = "mkdir -p $out";
  };
  build = pkgs.stdenv.mkDerivation {
    name = "squiggle-lang-build";
    # `peggy` is in the `node_modules` that's adjacent to `deps`.
    src = yarn-source + "/libexec/@quri/squiggle-lang";
    buildInputs = common.buildInputs;
    buildPhase = ''
      # so that the path to ppx doesn't need to be patched.
      mv node_modules deps

      pushd deps/@quri/squiggle-lang
      yarn --offline build:peggy
      yarn --offline build:typescript

      # custom gitignore so that the flake keeps build artefacts
      mv .gitignore GITIGNORE
      sed -i /peggyParser.js/d GITIGNORE
      sed -i /IncludeParser.js/d GITIGNORE
      sed -i /helpers.js/d GITIGNORE

      popd
    '';
    installPhase = ''
      mkdir -p $out
      # mkdir -p $out/node_modules
      mv deps/@quri/squiggle-lang/GITIGNORE deps/@quri/squiggle-lang/.gitignore

      # annoying hack because permissions on transitive dependencies later on
      mv deps/@quri/squiggle-lang/node_modules deps/@quri/squiggle-lang/NODE_MODULES
      mv deps/node_modules deps/@quri/squiggle-lang

      # the proper install phase
      cp -r deps/@quri/squiggle-lang/. $out
    '';
  };
  test = pkgs.stdenv.mkDerivation {
    name = "squiggle-lang-test";
    src = build;
    buildInputs = common.buildInputs;
    buildPhase = ''
      yarn --offline test
    '';
    installPhase = ''
      mkdir -p $out
      cp -r . $out
    '';
  };
  bundle = pkgs.stdenv.mkDerivation {
    name = "squiggle-lang-bundle";
    src = test;
    buildInputs = common.buildInputs;
    buildPhase = ''
      yarn --offline bundle
    '';
    installPhase = ''
      mkdir -p $out
      cp -r dist $out
      cp *.json $out/dist
    '';
  };

}
