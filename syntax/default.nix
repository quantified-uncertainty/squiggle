{ chan ? "a7ecde854aee5c4c7cd6177f54a99d2c1ff28a31" #  21.11 tag
, pkgs ? import (builtins.fetchTarball { url = "https://github.com/NixOS/nixpkgs/archive/${chan}.tar.gz"; }) {}
}:
# Style sheets https://github.com/citation-style-language/styles/
with pkgs;
let deps = [
      (texlive.combine
        { inherit (texlive)
        scheme-full;
        }
      )
    ];
in
  stdenv.mkDerivation {
    name = "render_squiggle-spec";
    src = ./spec;
    buildInputs = deps;
    buildPhase = ''
      echo rendering...
      pdflatex main
      biber main
      pdflatex main
      pdflatex main
      echo rendered.
    '';
    installPhase = ''
      mkdir -p $out
      cp main.pdf $out/squiggle-spec.pdf
      '';
  }
