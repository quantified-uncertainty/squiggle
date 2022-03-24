{
  description = "A Flake for building coq and providing devShells for the coq-tinyram project";

  inputs = {
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs =
    { self
    , nixpkgs
    , flake-compat
    }:
    let
      # Generate a user-friendly version number.
      version = builtins.substring 0 8 self.lastModifiedDate;
      # System types to support.
      supportedSystems = [ "x86_64-linux" "aarch64-linux" ];
      # Helper function to generate an attrset '{ x86_64-linux = f "x86_64-linux"; ... }'.
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      # Nixpkgs instantiated for supported system types.
      nixpkgsFor = forAllSystems (system:
        import nixpkgs {
          inherit system;
          overlays = [ self.overlay ];
        });
    in
    {
      overlay = final: prev: { };
      # the default devShell used when running `nix develop`
      devShell = forAllSystems (system: self.devShells.${system}.defaultShell);
      devShells = forAllSystems (system:
        let
          pkgs = nixpkgsFor."${system}";
        in
        {
          # In case we don't want to provide an editor, this defaultShell will
          # provide only coq packages we need.
          defaultShell = pkgs.mkShell {
            buildInputs = with pkgs; [
              yarn
            ];
          };
          # This is the defaultShell, but overriden to add one additional buildInput,
          # vscodium!
          vscodium = self.devShells.${system}.defaultShell.overrideAttrs (old: {
            buildInputs =
              let
                vscodeWithRescript = pkgs.vscode-with-extensions.override {
                  vscode = pkgs.vscodium;
                  vscodeExtensions = pkgs.vscode-utils.extensionsFromVscodeMarketplace [
                    {
                      name = "rescript-vscode";
                      publisher = "rescript-lang";
                      version = "1.2.1";
                      sha256 = "sha256-b0gCaEzt5yAj53oLFZSXSD3bum9J1fYes/uf9+OlUek=";
                    }
                  ];
                };
              in
              old.buildInputs
              ++ [
                vscodeWithRescript
              ];
          });
        });
    };
}
