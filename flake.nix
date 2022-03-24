{
  description = "Building codium for rescript development";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
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
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ];
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
          # In case we don't want to provide an editor, this defaultShell will provide only coq packages we need.
          defaultShell = pkgs.mkShell {
            buildInputs = with pkgs; [
              yarn
              yarn2nix
              nodePackages.npm
              nodejs
              (pkgs.vscode-with-extensions.override {
                  vscode = pkgs.vscodium;
                  vscodeExtensions = pkgs.vscode-utils.extensionsFromVscodeMarketplace [
                    {
                      name = "rescript-vscode";
                      publisher = "chenglou92";
                      version = "1.2.1";
                      sha256 = "sha256-7/YakKtJ4WhgAR4rZltrq8g4TtM5QZ2spbrEUrNoXVg=";
                    }
                    {
                      name = "vim";
                      publisher = "vscodevim";
                      version = "1.22.2";
                      sha256 = "sha256-dtIlgODzRdoMKnG9050ZcCX3w15A/R3FaMc+ZylvBbU=";
                    }
                    {
                      name = "vscode-typescript-next";
                      publisher = "ms-vscode";
                      version = "4.7.20220323";
                      sha256 = "sha256-mjiBCyg5As/XAU9I5k6jEZWGJA3P6P5o1roe2bS7aUI=";
                    }
                    {
                      name = "nix-ide";
                      publisher = "jnoortheen";
                      version = "0.1.20";
                      sha256 = "sha256-Q6X41I68m0jaCXaQGEFOoAbSUrr/wFhfCH5KrduOtZo=";
                    }
                    {
                      name = "json";
                      publisher = "ZainChen";
                      version = "2.0.2";
                      sha256 = "sha256-nC3Q8KuCtn/jg1j/NaAxWGvnKe/ykrPm2PUjfsJz8aI=";
                    }
                    {
                      name = "prettier-vscode";
                      publisher = "esbenp";
                      version = "9.3.0";
                      sha256 = "sha256-hJgPjWf7a8+ltjmXTK8U/MwqgIZqBjmcCfHsAk2G3PA=";
                    }
                  ];
              })
            ];
          };
        }
      );
    };
}
