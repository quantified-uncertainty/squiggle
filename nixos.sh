#!/usr/bin/env bash
set -x

fhsShellName="squiggle-development"
# Esy (a bisect_ppx dependency/build tool) is borked on nixos without using an FHS shell. https://github.com/esy/esy/issues/858
fhsShellDotNix="{pkgs ? import <nixpkgs> {} }: (pkgs.buildFHSUserEnv { name = \"${fhsShellName}\"; targetPkgs = pkgs: [pkgs.yarn]; runScript = \"yarn\"; }).env"
nix-shell - <<<"$fhsShellDotNix"

# We need to patchelf rescript executables. https://github.com/NixOS/nixpkgs/issues/107375
theLd=$(patchelf --print-interpreter $(which mkdir))
patchelf --set-interpreter $theLd ./node_modules/gentype/gentype.exe
patchelf --set-interpreter $theLd ./node_modules/rescript/linux/*.exe
patchelf --set-interpreter $theLd ./node_modules/bisect_ppx/ppx
theSo=$(find /nix/store/*$fhsShellName*/lib64 -name libstdc++.so.6 | grep squiggle-development | head -n 1)
patchelf --replace-needed libstdc++.so.6 $theSo ./node_modules/rescript/linux/ninja.exe
