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
    name = "squiggle-website_source";
    src = ../packages/website;
    packageJSON = websitePackageJson;
    yarnLock = ../yarn.lock;
    packageResolutions."@quri/squiggle-lang" = lang.build;
    packageResolutions."@quri/squiggle-components" = components.package-build;
    workspaceDependencies = [ lang.yarn-source components.yarn-source ];
  };
  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-website-lint";
    buildInputs = common.buildInputs ++ common.prettier;
    src = yarn-source + "/libexec/squiggle-website/deps/squiggle-website";
    buildPhase = "yarn --offline lint";
    installPhase = "mkdir -p $out";
  };
  docusaurus = pkgs.stdenv.mkDerivation {
    name = "squiggle-website";
    buildInputs = common.buildInputs;
    src = yarn-source + "/libexec/squiggle-website";
    buildPhase = ''
      pushd deps/squiggle-website
      yarn --offline build
      popd
    '';
    installPhase = ''
      mkdir -p $out
      cp -r $src/build $out
    '';
  };
}
