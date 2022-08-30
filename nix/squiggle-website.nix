{ pkgs, commonFn, langFn, componentsFn }:

rec {
  common = commonFn pkgs;
  lang = langFn pkgs;
  components = componentsFn pkgs;
  websitePackageJson = let
    raw = pkgs.lib.importJSON ../packages/website/package.json;
    modified = pkgs.lib.recursiveUpdate raw {
      dependencies.postcss-import = "^14.1.0";
      dependencies.tailwindcss = "^3.1.8";
    };
    packageJsonString = builtins.toJSON modified;
  in pkgs.writeText "packages/website/patched-package.json" packageJsonString;
  yarn-source = pkgs.mkYarnPackage {
    name = "squiggle-website_yarnsource";
    src = ../packages/website;
    packageJSON = websitePackageJson;
    yarnLock = ../yarn.lock;
    packageResolutions."@quri/squiggle-lang" = lang.build;
    packageResolutions."@quri/squiggle-components" = components.build;
  };
  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-website-lint";
    buildInputs = common.buildInputs ++ common.prettier;
    src = ../packages/website;
    buildPhase = "yarn lint";
    installPhase = "mkdir -p $out";
  };
}
