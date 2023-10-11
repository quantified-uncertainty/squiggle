import { SqProject } from "../../src/index.js";
import { Resolver } from "../../src/public/SqProject/Resolver.js";

const buildResolver = (sources?: { [k: string]: string }) => {
  const resolver: Resolver = {
    resolve: (name) => name,
    loadSource: async (id) => {
      if (sources && id in sources) {
        return sources[id];
      }
      throw new Error(`Unknown id ${id}`);
    },
  };
  return resolver;
};

describe("Parse imports", () => {
  const project = SqProject.create({ resolver: buildResolver() });
  project.setSource(
    "main",
    `
import './common' as common
import "./myModule" as myVariable
x=1`
  );
  project.parseImports("main");

  test("dependencies", () => {
    expect(project.getDependencies("main")).toEqual(["./common", "./myModule"]);
  });

  test("getImportIds", () => {
    const mainImportIds = project.getImportIds("main");
    if (mainImportIds.ok) {
      expect(mainImportIds.value).toEqual(["./common", "./myModule"]);
    } else {
      throw new Error(mainImportIds.value.toString());
    }
  });

  test("getImports", () => {
    expect(project.getImports("main")).toEqual({
      ok: true,
      value: [
        { variable: "common", sourceId: "./common" },
        { variable: "myVariable", sourceId: "./myModule" },
      ],
    });
  });

  test("continues", () => {
    expect(project.getContinues("main")).toEqual([]);
  });
});

describe("Unknown imports", () => {
  test("without resolver", async () => {
    const project = SqProject.create();
    project.setSource(
      "main",
      `
import './lib' as lib
123`
    );

    await project.run("main");

    expect(project.getResult("main").ok).toEqual(false);
  });

  test("unknown import", () => {
    const project = SqProject.create({ resolver: buildResolver() });
    project.setSource(
      "main",
      `
import './lib' as lib
lib.x`
    );

    expect(project.run("main")).rejects.toThrow();
  });

  test("known import", async () => {
    const project = SqProject.create({
      resolver: buildResolver({
        "./lib": "x = 5",
      }),
    });
    project.setSource(
      "main",
      `
import './lib' as lib
lib.x`
    );

    expect(project.run("main")).resolves.toBe(undefined);

    await project.run("main");
    expect(project.getResult("main").ok).toEqual(true);
  });
});
