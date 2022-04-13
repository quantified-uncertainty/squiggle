{ chan ? "a7ecde854aee5c4c7cd6177f54a99d2c1ff28a31"  # 21.11
, pkgs ? import (builtins.fetchTarball { url = "https://github.com/NixOS/nixpkgs/archive/${chan}.tar.gz"; }) {}
}:
# Style sheets https://github.com/citation-style-language/styles/
with pkgs;

let deps = [
  pandoc 
  (texlive.combine 
    { inherit (texlive) scheme-small datetime; }
  )
]; in
stdenv.mkDerivation {
  name = "render_squiggle_properties";
  src = ./.;
  buildInputs = deps;
  buildPhase = ''
    echo rendering...
    pandoc -s invariants.md -o invariants.pdf 
    echo rendered.
  '';
  installPhase = ''
    mkdir -p $out
    cp invariants.pdf $out/invariants.pdf
    '';
}
