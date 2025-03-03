import { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("internal-package", {
    description: "Create a new internal package",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the internal package?",
        validate: (input: string) => {
          if (input.includes(" ")) {
            return "package name cannot include spaces";
          }
          if (!input) {
            return "package name is required";
          }
          return true;
        },
      },
    ],
    actions: [
      // Create package.json
      {
        type: "add",
        path: "{{ turbo.paths.root }}/internal-packages/{{ dashCase name }}/package.json",
        templateFile: "templates/internal-package/package.json.hbs",
      },
      // Create tsconfig.json
      {
        type: "add",
        path: "{{ turbo.paths.root }}/internal-packages/{{ dashCase name }}/tsconfig.json",
        templateFile: "templates/internal-package/tsconfig.json.hbs",
      },
      // Create src directory with index.ts
      {
        type: "add",
        path: "{{ turbo.paths.root }}/internal-packages/{{ dashCase name }}/src/index.ts",
        templateFile: "templates/internal-package/index.ts.hbs",
      },
    ],
  });
}
