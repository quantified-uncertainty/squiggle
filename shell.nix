{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  name = "squiggle-root";
  buildInputs = with pkgs; [ nodePackages.yarn ];
}
