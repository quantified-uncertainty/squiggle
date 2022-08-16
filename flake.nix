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
    let
      commonFn = pkgs: {
        buildInputs = with pkgs; [ nodejs yarn ];
        prettier = with pkgs.nodePackages; [ prettier ];
        which = [ pkgs.which ];
      };
      langFn = { pkgs, ... }:
        import ./nix/squiggle-lang.nix { inherit pkgs commonFn gentype; };
      componentsFn = { pkgs, ... }:
        import ./nix/squiggle-components.nix { inherit pkgs commonFn langFn; };
      websiteFn = { pkgs, ... }:
        import ./nix/squiggle-website.nix {
          inherit pkgs commonFn langFn componentsFn;
        };

      # local machines
      localFlake = { pkgs }:
        let
          lang = langFn pkgs;
          components = componentsFn pkgs;
          website = websiteFn pkgs;
        in {
          # validating
          checks = flake-utils.lib.flattenTree {
            lang-lint = lang.lang-lint;
            lang-test = lang.lang-test;
            components-lint = components.components-lint;
            docusaurus-lint = website.website-lint;
          };
          # building
          packages = flake-utils.lib.flattenTree {
            default = website.website;
            lang-build = lang.lang-build;
            lang-bundle = lang.lang-bundle;
            components = components.components-package-build;
            storybook = components.components-site-build;
            docs-site = website.website;
          };

          # developing
          devShells = flake-utils.lib.flattenTree {
            default = (import ./nix/shell.nix { inherit pkgs; }).shell;
          };
        };

      # ci
      herc = let
        hciSystem = "x86_64-linux";
        hciPkgs = import nixpkgs { system = hciSystem; };
        effects = hercules-ci-effects.lib.withPkgs hciPkgs;
        local = localFlake {
          pkgs = hciPkgs;
          lang = langFn { pkgs = hciPkgs; };
          components = componentsFn { pkgs = hciPkgs; };
          website = websiteFn { pkgs = hciPkgs; };
        };
      in {
        # herc
        herculesCI = {
          ciSystems = [ hciSystem ];
          onPush = {
            lang.outputs = {
              squiggle-lang-lint = local.checks.${hciSystem}.lang-lint;
              squiggle-lang-test = local.checks.${hciSystem}.lang-test;
              # squiggle-lang-build = lang.lang-build;
              squiggle-lang-bundle = local.packages.${hciSystem}.lang-bundle;
            };
            components.outputs = {
              squiggle-components = local.packages.${hciSystem}.components;
              squiggle-components-lint =
                local.checks.${hciSystem}.components-lint;
              squiggle-components-storybook =
                local.packages.${hciSystem}.storybook;
            };
            docs-site.outputs = {
              squiggle-website = local.packages.${hciSystem}.docs-site;
              docusaurus-lint = local.checks.${hciSystem}.docusaurus-lint;
            };
          };
        };

      };
    in flake-utils.lib.eachSystem [ "x86_64-linux" ] (system:
      let
        # globals
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

      in (localFlake { inherit pkgs; } )) // herc;
}
