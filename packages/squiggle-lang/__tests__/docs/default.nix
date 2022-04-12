{ chan ? "a7ecde854aee5c4c7cd6177f54a99d2c1ff28a31"  # 21.11
, pkgs ? import (builtins.fetchTarball { url = "https://github.com/NixOS/nixpkgs/archive/${chan}.tar.gz"; }) {}
}:
# Style sheets https://github.com/citation-style-language/styles/
with pkgs;

stdenv.mkDerivation {
  name = "render_squiggle_properties";
  src = ./.;
  buildInputs = [pandoc];
  buildPhase = ''
    echo rendering...
    pandoc \
           --from markdown \
           --to latex \
           --out properties.pdf \
           --pdf-engine xelatex \
           properties.md \
    echo rendered.
  '';
  installPhase = ''
    mkdir -p $out
    cp properties.pdf $out/properties.pdf
    '';
}
