{
  description = "Squiggle CI";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-22.05";
    cargo2nix = {
      url = "github:cargo2nix/cargo2nix/release-0.11.0";
      inputs.nixpkgs.follows = "nixpkgs";
    };
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

  outputs = { self, nixpkgs, gentype, hercules-ci-effects, cargo2nix, flake-utils, ... }:
    let
      version = builtins.substring 0 8 self.lastModifiedDate;
      commonFn = pkgs: {
        buildInputs = with pkgs; [ nodejs yarn ];
        prettier = with pkgs.nodePackages; [ prettier ];
        which = [ pkgs.which ];
      };
      gentypeOutputFn = pkgs: gentype.outputs.packages.${pkgs.system}.default;
      mcCacheFn = { pkgs, ... }:
        import ./nix/squiggle-mcCache.nix { inherit pkgs; };
      langFn = { pkgs, ... }:
        import ./nix/squiggle-lang.nix {
          inherit pkgs commonFn mcCacheFn gentypeOutputFn;
        };
      componentsFn = { pkgs, ... }:
        import ./nix/squiggle-components.nix { inherit pkgs commonFn mcCacheFn langFn; };
      websiteFn = { pkgs, ... }:
        import ./nix/squiggle-website.nix {
          inherit pkgs commonFn mcCacheFn langFn componentsFn;
        };

      # local machines
      localFlake = { pkgs, ... }:
        let
          mcCache = mcCacheFn pkgs;
          lang = langFn pkgs;
          components = componentsFn pkgs;
          website = websiteFn pkgs;
        in {
          # validating
          checks = flake-utils.lib.flattenTree {
            lang-lint = lang.lint;
            lang-test = lang.test;
            components-lint = components.lint;
            docusaurus-lint = website.lint;
          };
          # building
          packages = flake-utils.lib.flattenTree {
            default = website.docusaurus;
            mc-wasm = mcCache.mc-cached;
            lang-bundle = lang.bundle;
            components = components.package-build;
            storybook = components.site-build;
            docs-site = website.docusaurus;
          };

          # developing
          devShells = flake-utils.lib.flattenTree {
            default = (import ./nix/shell.nix { inherit pkgs cargo2nix; }).shell;
          };
        };

      # ci
      herc = let
        hciSystem = "x86_64-linux";
        hciPkgs = import nixpkgs { system = hciSystem; };
        effects = hercules-ci-effects.lib.withPkgs hciPkgs;
        lang = langFn hciPkgs;
        components = componentsFn hciPkgs;
        website = websiteFn hciPkgs;
      in {
        herculesCI = {
          ciSystems = [ hciSystem ];
          onPush = {
            lang.outputs = {
              squiggle-lang-lint = lang.lint;
              squiggle-lang-build = lang.build;
              squiggle-lang-test = lang.test;
              squiggle-lang-bundle = lang.bundle;
            };
            components.outputs = {
              squiggle-components = components.package-build;
              squiggle-components-lint = components.lint;
              squiggle-components-storybook = components.site-build;
            };
            docs-site.outputs = {
              squiggle-website = website.docusaurus;
              docusaurus-lint = website.lint;
            };
          };
        };
      };
    in flake-utils.lib.eachDefaultSystem (system:
      let
        # globals
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            cargo2nix.overlays.default
            (final: prev: {
              # set the node version here
              nodejs = prev.nodejs-18_x;
              # The override is the only way to get it into mkYarnModules
            })
          ];
        };

      in localFlake pkgs) // herc;
}
