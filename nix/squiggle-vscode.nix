{ pkgs, commonFn, langFn, componentsFn }:

rec {
  common = commonFn pkgs;
  lang = langFn pkgs;
  components = componentsFn pkgs;

  yarn-source = pkgs.mkYarnPackage {
    name = "squiggle-vscodeext_yarnsource";
    src = ../packages/vscode-ext;
    packageJson = ../packages/vscode-ext/package.json;
    yarnLock = ../yarn.lock;
    packageResolutions."@quri/squiggle-lang" = lang.build;
    packageResolutions."@quri/squiggle-components" = components.build;
  };
  lint = pkgs.stdenv.mkDerivation {
    name = "squiggle-vscode-lint";
    buildInputs = common.buildInputs ++ common.prettier;
    src =
      ../packages/vscode-ext; # yarn-source + "/libexec/vscode-squiggle/deps/vscode-squiggle";
    buildPhase = "prettier --check .";
    installPhase = "mkdir -p $out";
  };
}
