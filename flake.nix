{
  description = "Squiggle packages";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-22.05";
    gentype = {
      url = "github:rescript-association/genType";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, gentype, flake-utils }:
    let
      version = builtins.substring 0 8 self.lastModifiedDate;
      overlays = [
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
      langFn = { pkgs, ... }:
        # Probably doesn't work on i686-linux
        import ./nix/squiggle-lang.nix {
          inherit pkgs commonFn gentypeOutputFn;
        };
      componentsFn = { pkgs, ... }:
        import ./nix/squiggle-components.nix { inherit pkgs commonFn langFn; };
      websiteFn = { pkgs, ... }:
        import ./nix/squiggle-website.nix {
          inherit pkgs commonFn langFn componentsFn;
        };
      vscodeextFn = { pkgs, ... }:
        import ./nix/squiggle-vscode.nix {
          inherit pkgs commonFn langFn componentsFn;
        };
      cliFn = { pkgs, ... }:
        import ./nix/squiggle-cli.nix {
          inherit pkgs commonFn;
        };

      # local machines
      localFlakeOutputs = { pkgs, ... }:
        let
          lang = langFn pkgs;
          components = componentsFn pkgs;
          website = websiteFn pkgs;
          vscodeext = vscodeextFn pkgs;
          cli = cliFn pkgs;
        in {
          # validating
          checks = flake-utils.lib.flattenTree {
            lang-lint = lang.lint;
            lang-test = lang.test;
            components-lint = components.lint;
            docusaurus-lint = website.lint;
            cli-lint = cli.lint;
          };
          # building
          packages = flake-utils.lib.flattenTree {
            default = components.build;
            lang = lang.build;
            lang-bundle = lang.bundle;
            lang-test = lang.test;
            components = components.build;
            components-bundle = components.bundle;

            # Lint
            lang-lint = lang.lint;
            components-lint = components.lint;
            docusaurus-lint = website.lint;
            vscode-lint = vscodeext.lint;
            cli-lint = cli.lint;
          };

          # developing
          devShells = let shellNix = import ./nix/shell.nix { inherit pkgs; };
          in flake-utils.lib.flattenTree {
            default = shellNix.all;
            js = shellNix.just-js;
          };
        };
    in flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = overlays;
        };

      in localFlakeOutputs pkgs);
}
