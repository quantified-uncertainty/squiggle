{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  name = "squiggle";
  buildInputs = with pkgs; [ yarn yarn2nix nodePackages.npm ];
}
