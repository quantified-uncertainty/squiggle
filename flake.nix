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

        common = {
          buildInputs = with pkgs; [ nodejs yarn ];
          prettier = with pkgs.nodePackages; [ prettier ];
          which = [ pkgs.which ];
        };
        lang = import ./nix/squiggle-lang.nix {
          inherit system pkgs common gentype;
        };
        components =
          import ./nix/squiggle-components.nix { inherit pkgs common lang; };
        website = import ./nix/squiggle-website.nix {
          inherit pkgs common lang components;
        };

      in rec {

        checks = flake-utils.lib.flattenTree {
          lang-lint = lang.lang-lint;
          lang-test = lang.lang-test;
          components-lint = components.components-lint;
          docusaurus-lint = website.website-lint;
        };
        packages = flake-utils.lib.flattenTree {
          default = website.website;
          lang-bundle = lang.lang-bundle;
          components = components.components-package-build;
          storybook = components.components-site-build;
          docs-site = website.website;
        };

        # nix develop
        devShells = flake-utils.lib.flattenTree {
          default = (import ./nix/shell.nix { inherit pkgs; }).shell;
        };

        # herc
        herculesCI = flake-utils.lib.flattenTree {
          ciSystems = [ hciSystem ];
          onPush = {
            lang.outputs = {
              squiggle-lang-lint = checks.${hciSystem}.lang-lint;
              squiggle-lang-test = checks.${hciSystem}.lang-test;
              squiggle-lang-build = lang.lang-build;
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

      });
}
