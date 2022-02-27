{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell { 
  name = "squiggle-components";
  buildInputs = with pkgs; [ nodePackages.yarn nodejs ];
}
