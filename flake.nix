{
  description = "Squiggle CI";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-22.05";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
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

  outputs = { self, nixpkgs, rust-overlay, gentype, hercules-ci-effects, flake-utils, ... }:
    let
      version = builtins.substring 0 8 self.lastModifiedDate;
      overlays = [
        rust-overlay.overlays.default
        (final: prev: {
          # set the node version here
          nodejs = prev.nodejs-18_x;
          # The override is the only way to get it into mkYarnModules
        })
      ];

      commonFn = pkgs: {
        buildInputs = with pkgs; [ nodejs yarn ];
        prettier = with pkgs.nodePackages; [ prettier ];
        which = [ pkgs.which ];
      };
      gentypeOutputFn = pkgs: gentype.outputs.packages.${pkgs.system}.default;
      mcFn = { pkgs, ... }:
        import ./nix/squiggle-mc.nix {
          inherit pkgs;
        };
      langFn = { pkgs, ... }:
        # Probably doesn't work on i686-linux
        import ./nix/squiggle-lang.nix {
          inherit pkgs commonFn mcFn gentypeOutputFn;
        };
      componentsFn = { pkgs, ... }:
        import ./nix/squiggle-components.nix {
          inherit pkgs commonFn mcFn langFn;
        };
      websiteFn = { pkgs, ... }:
        import ./nix/squiggle-website.nix {
          inherit pkgs commonFn mcFn langFn componentsFn;
        };

      # local machines
      localFlake = { pkgs, ... }:
        let
          mc = mcFn pkgs;
          lang = langFn pkgs;
          components = componentsFn pkgs;
          website = websiteFn pkgs;
        in {
          # validating
          checks = flake-utils.lib.flattenTree {
            wasm-lint = mc.lint;
            wasm-test = mc.test;
            lang-lint = lang.lint;
            lang-test = lang.test;
            components-lint = components.lint;
            docusaurus-lint = website.lint;
          };
          # building
          packages = flake-utils.lib.flattenTree {
            default = components.build;
            mc-wasm = mc.pkg;
            lang-bundle = lang.bundle;
            components = components.build;
            components-bundle = components.bundle;
          };

          # developing
          devShells = flake-utils.lib.flattenTree {
            default =
              (import ./nix/shell.nix { inherit pkgs; }).shell;
          };
        };

      # ci
      herc = let
        hciSystem = "x86_64-linux";
        hciPkgs = import nixpkgs { system = hciSystem; overlays = overlays; };
        effects = hercules-ci-effects.lib.withPkgs hciPkgs;
        mc = mcFn hciPkgs;
        lang = langFn hciPkgs;
        components = componentsFn hciPkgs;
        website = websiteFn hciPkgs;
      in {
        herculesCI = {
          ciSystems = [ hciSystem ];
          onPush = {
            wasm.outputs = {
              squiggle-wasm-lint = mc.lint;
              squiggle-wasm-pkg = mc.pkg;
              squiggle-wasm-test = mc.test;
            };
            lang.outputs = {
              squiggle-lang-lint = lang.lint;
              squiggle-lang-build = lang.build;
              squiggle-lang-test = lang.test;
              squiggle-lang-bundle = lang.bundle;
            };
            components.outputs = {
              squiggle-components-lint = components.lint;
              squiggle-components = components.build;
              squiggle-components-bundle = components.bundle;
            };
            docs-site.outputs = {
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
          overlays = overlays;
        };

      in localFlake pkgs) // herc;
}
