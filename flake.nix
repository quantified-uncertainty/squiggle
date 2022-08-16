{
  description = "Squiggle CI";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-22.05";
    gentype = {
      url = "github:quinn-dougherty/genType";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    hercules-ci-effects = {
      url = "github:hercules-ci/hercules-ci-effects";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils = {
      url = "github:numtide/flake-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, gentype, hercules-ci-effects, flake-utils, ... }:
    flake-utils.lib.eachSystem [ "x86_64-linux" ] (system:
      let
        # globals
        hciSystem = "x86_64-linux";
        pkgs = import nixpkgs {
          system = system;
          overlays = [
            (final: prev: {
              # set the node version here
              nodejs = prev.nodejs-16_x;
              # The override is the only way to get it into mkYarnModules
            })
          ];
        };
        hciPkgs = import nixpkgs { system = hciSystem; };
        effects = hercules-ci-effects.lib.withPkgs hciPkgs;

        buildInputsCommon = with pkgs; [ nodejs yarn ];
        prettierCommon = with pkgs.nodePackages; [ prettier ];
        pkgWhich = [ pkgs.which ];

        # To get prettier into later source trees
        monorepo-yarnPackage = pkgs.mkYarnPackage {
          name = "squiggle-monorepo_source";
          src = ./.;
          packageJSON = ./package.json;
          yarnLock = ./yarn.lock;
        };

        # packages in subrepos
        lang-yarnPackage = pkgs.mkYarnPackage {
          name = "squiggle-lang_source";
          src = ./packages/squiggle-lang;
          packageJSON = ./packages/squiggle-lang/package.json;
          yarnLock = ./yarn.lock;
          # extraBuildInputs = prettierCommon;
          pkgConfig = {
            rescript = {
              buildInputs = pkgWhich ++ [ pkgs.gcc_multi ];
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
            bisect_ppx = {
              buildInputs =
                pkgWhich; # ++ (with pkgs; [ ocaml nodePackages.esy ocamlPackages.bisect_ppx ]);
              postInstall = ''
                echo "PATCHELF'ING BISECT_PPX EXECUTABLE"
                THE_LD=$(patchelf --print-interpreter $(which mkdir))
                patchelf --set-interpreter $THE_LD bin/linux/ppx
                patchelf --set-interpreter $THE_LD bin/linux/bisect-ppx-report
              '';
            };
            gentype = {
              postInstall = ''
                mv gentype.exe ELFLESS-gentype.exe
                cp ${
                  gentype.outputs.defaultPackage."${system}"
                }/GenType.exe gentype.exe
              '';
            };
          };
        };
        lang-lint = pkgs.stdenv.mkDerivation {
          name = "squiggle-lang-lint";
          src = lang-yarnPackage
            + "/libexec/@quri/squiggle-lang/deps/@quri/squiggle-lang";
          buildInputs = buildInputsCommon ++ prettierCommon;
          buildPhase = ''
            yarn lint:prettier
            yarn lint:rescript
          '';
          installPhase = "mkdir -p $out";
        };
        lang-build = pkgs.stdenv.mkDerivation {
          name = "squiggle-lang-build";
          # `peggy` is in the `node_modules` that's adjacent to `deps`.
          src = lang-yarnPackage + "/libexec/@quri/squiggle-lang";
          buildInputs = buildInputsCommon;
          buildPhase = ''
            mv node_modules deps
            pushd deps/@quri/squiggle-lang
            yarn --offline build:peggy
            yarn --offline build:rescript
            yarn --offline build:typescript

            # custom gitignore so that the flake keeps build artefacts
            mv .gitignore GITIGNORE
            sed -i /Reducer_Peggy_GeneratedParser.js/d GITIGNORE
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
        lang-test = pkgs.stdenv.mkDerivation {
          name = "squiggle-lang-test";
          src = lang-build;
          buildInputs = buildInputsCommon;
          buildPhase = ''
            yarn --offline test
          '';
          installPhase = ''
            mkdir -p $out
            cp -r . $out
          '';
        };
        lang-bundle = pkgs.stdenv.mkDerivation {
          name = "squiggle-lang-bundle";
          src = lang-test;
          buildInputs = buildInputsCommon;
          buildPhase = ''
            yarn --offline bundle
          '';
          installPhase = ''
            mkdir -p $out
            cp -r dist $out
            cp *.json $out/dist
          '';
        };

        componentsPackageJson = let
          raw = pkgs.lib.importJSON ./packages/components/package.json;
          modified = pkgs.lib.recursiveUpdate raw {
            dependencies.react-dom = "^18.2.0";
          };
          packageJsonString = builtins.toJSON modified;
        in pkgs.writeText "packages/components/patched-package.json"
        packageJsonString;
        components-yarnPackage = pkgs.mkYarnPackage {
          name = "squiggle-components_source";
          buildInputs = buildInputsCommon;
          src = ./packages/components;
          packageJSON = componentsPackageJson;
          yarnLock = ./yarn.lock;
          packageResolutions."@quri/squiggle-lang" = lang-build;
        };
        components-lint = pkgs.stdenv.mkDerivation {
          name = "squiggle-components-lint";
          src = components-yarnPackage
            + "/libexec/@quri/squiggle-components/deps/@quri/squiggle-components";
          buildInputs = buildInputsCommon ++ prettierCommon;
          buildPhase = "yarn lint";
          installPhase = "mkdir -p $out";
        };
        components-package-build = pkgs.stdenv.mkDerivation {
          name = "squiggle-components-package-build";
          src = components-yarnPackage + "/libexec/@quri/squiggle-components";
          buildInputs = buildInputsCommon;
          buildPhase = ''
            cp -r node_modules/@quri/squiggle-lang deps/@quri
            pushd deps/@quri/squiggle-components

            yarn --offline build:cjs
            yarn --offline build:css
            popd
          '';
          installPhase = ''
            mkdir -p $out

            # annoying hack because permissions on transitive dependencies later on
            mv deps/@quri/squiggle-components/node_modules deps/@quri/squiggle-components/NODE_MODULES
            mv node_modules deps/@quri/squiggle-components

            # patching .gitignore so flake keeps build artefacts
            sed -i /dist/d deps/@quri/squiggle-components/.gitignore
            cp -r deps/@quri/squiggle-components/. $out
          '';
        };
        components-site-build = pkgs.stdenv.mkDerivation {
          name = "squiggle-components-storybook";
          src = components-package-build;
          buildInputs = buildInputsCommon;
          buildPhase = "yarn build:storybook";
          installPhase = ''
            mkdir -p $out

            # patching .gitignore so flake keeps build artefacts
            sed -i /build/d .gitignore
            sed -i /storybook-static/d .gitignore
          '';
        };

        websitePackageJson = let
          raw = pkgs.lib.importJSON ./packages/website/package.json;
          modified = pkgs.lib.recursiveUpdate raw {
            dependencies.postcss-import = "^14.1.0";
            dependencies.tailwindcss = "^3.1.8";
          };
          packageJsonString = builtins.toJSON modified;
        in pkgs.writeText "packages/website/patched-package.json"
        packageJsonString;
        website-yarnPackage = pkgs.mkYarnPackage {
          name = "squiggle-website_source";
          src = ./packages/website;
          packageJSON = websitePackageJson;
          yarnLock = ./yarn.lock;
          packageResolutions."@quri/squiggle-lang" = lang-build;
          packageResolutions."@quri/squiggle-components" =
            components-package-build;
          workspaceDependencies = [ lang-yarnPackage components-yarnPackage ];
        };
        website-lint = pkgs.stdenv.mkDerivation {
          name = "squiggle-website-lint";
          buildInputs = buildInputsCommon ++ prettierCommon;
          src = website-yarnPackage
            + "/libexec/squiggle-website/deps/squiggle-website";
          buildPhase = "yarn --offline lint";
          installPhase = "mkdir -p $out";
        };
        website = pkgs.stdenv.mkDerivation {
          name = "squiggle-website";
          buildInputs = buildInputsCommon;
          src = website-yarnPackage + "/libexec/squiggle-website";
          buildPhase = ''
            pushd deps/squiggle-website
            yarn --offline build
            popd
          '';
          installPhase = ''
            mkdir -p $out
            cp -r $src/build $out
          '';
        };
      in rec {

        checks = flake-utils.lib.flattenTree {
          lang-lint = lang-lint;
          lang-test = lang-test;
          components-lint = components-lint;
          docusaurus-lint = website-lint;
        };
        packages = flake-utils.lib.flattenTree {
          default = website;
          lang-bundle = lang-bundle;
          components = components-package-build;
          storybook = components-site-build;
          docs-site = website;
        };

        # herc
        herculesCI = flake-utils.lib.flattenTree {
          ciSystems = [ hciSystem ];
          onPush = {
            lang.outputs = {
              squiggle-lang-lint = checks.${hciSystem}.lang-lint;
              squiggle-lang-test = checks.${hciSystem}.lang-test;
              squiggle-lang-build = lang-build;
              squiggle-lang-bundle = packages.${hciSystem}.lang-bundle;
            };
            components.outputs = {
              squiggle-components = packages.${hciSystem}.components;
              squiggle-components-lint = checks.${hciSystem}.components-lint;
              squiggle-components-storybook = packages.${hciSystem}.storybook;
            };
            docs-site.outputs = {
              squiggle-website = packages.${hciSystem}.docs-site;
              docusaurus-lint = checks.${hciSystem}.docusaurus-lint;
            };
          };
        };

        # nix develop
        devShells = flake-utils.lib.flattenTree {
          default = pkgs.mkShell {
            name = "squiggle-wasm-development-shell";
            buildInputs = with pkgs; [
              wasm-pack
              cargo
              cargo-generate
              yarn
              rustup
              pkg-config
              openssl
              nixfmt
            ];
          };
        };
      });
}
