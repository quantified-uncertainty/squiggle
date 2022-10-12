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
    pkgConfig = {
      rescript = {
        buildInputs = common.which
          ++ (if pkgs.system != "i686-linux" then [ pkgs.gcc_multi ] else [ ]);
        postInstall = ''
          echo "PATCHELF'ING RESCRIPT EXECUTABLES (INCL NINJA)"
          # Patching interpreter for linux/*.exe's
          THE_LD=$(patchelf --print-interpreter $(which mkdir))
          patchelf --set-interpreter $THE_LD linux/*.exe && echo "- patched interpreter for linux/*.exe's"

          # Replacing needed shared library for linux/ninja.exe
          THE_SO=$(find /nix/store/*/lib64 -name libstdc++.so.6 | head -n 1)
          patchelf --replace-needed libstdc++.so.6 $THE_SO linux/ninja.exe && echo "- replaced needed for linux/ninja.exe"
        '';
      };
      gentype = {
        postInstall = ''
          mv gentype.exe ELFLESS-gentype.exe
          cp ${gentypeOutputFn pkgs}/src/GenType.exe gentype.exe
        '';
      };
    };
  };
  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-lang-lint";
    src = yarn-source + "/libexec/@quri/squiggle-lang/deps/@quri/squiggle-lang";
    buildInputs = common.buildInputs ++ common.prettier;
    buildPhase = ''
      yarn lint:prettier
      yarn lint:rescript
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
      yarn --offline build:rescript
      yarn --offline build:typescript

      # custom gitignore so that the flake keeps build artefacts
      mv .gitignore GITIGNORE
      sed -i /Reducer_Peggy_GeneratedParser.js/d GITIGNORE
      sed -i /ReducerProject_IncludeParser.js/d GITIGNORE
      sed -i /\*.bs.js/d GITIGNORE
      sed -i /\*.gen.ts/d GITIGNORE
      sed -i /\*.gen.tsx/d GITIGNORE
      sed -i /\*.gen.js/d GITIGNORE
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
