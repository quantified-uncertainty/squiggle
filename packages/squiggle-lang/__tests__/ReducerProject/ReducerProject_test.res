@@warning("-44")
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

let runFetchResult = (project, sourceId) => {
  Project.run(project, sourceId)
  Project.getResult(project, sourceId)->Reducer_Value.toStringResult
}

let runFetchFlatBindings = (project, sourceId) => {
  Project.run(project, sourceId)
  Project.getBindings(project, sourceId)->Reducer_Value.toStringRecord
}

test("test result true", () => {
  let project = Project.createProject()
  Project.setSource(project, "main", "true")
  runFetchResult(project, "main")->expect->toBe("Ok(true)")
})

test("test result false", () => {
  let project = Project.createProject()
  Project.setSource(project, "main", "false")
  runFetchResult(project, "main")->expect->toBe("Ok(false)")
})

test("test library", () => {
  let project = Project.createProject()
  Project.setSource(project, "main", "x=Math.pi; x")
  runFetchResult(project, "main")->expect->toBe("Ok(3.141592653589793)")
})

test("test bindings", () => {
  let project = Project.createProject()
  Project.setSource(project, "variables", "myVariable=666")
  runFetchFlatBindings(project, "variables")->expect->toBe("{myVariable: 666}")
})

describe("project1", () => {
  let project = Project.createProject()
  Project.setSource(project, "first", "x=1")
  Project.setSource(project, "main", "x")
  Project.setContinues(project, "main", ["first"])

  test("runOrder", () => {
    expect(Project.getRunOrder(project)) == ["first", "main"]
  })
  test("dependents first", () => {
    expect(Project.getDependents(project, "first")) == ["main"]
  })
  test("dependencies first", () => {
    expect(Project.getDependencies(project, "first")) == []
  })
  test("dependents main", () => {
    expect(Project.getDependents(project, "main")) == []
  })
  test("dependencies main", () => {
    expect(Project.getDependencies(project, "main")) == ["first"]
  })

  test("past chain first", () => {
    expect(ReducerProject.getPastChain(project, "first")) == []
  })
  test("past chain main", () => {
    expect(ReducerProject.getPastChain(project, "main")) == ["first"]
  })

  test("test result", () => {
    runFetchResult(project, "main")->expect->toBe("Ok(1)")
  })
  test("test bindings", () => {
    runFetchFlatBindings(project, "first")->expect->toBe("{x: 1}")
  })
})

describe("project2", () => {
  let project = Project.createProject()
  Project.setContinues(project, "main", ["second"])
  Project.setContinues(project, "second", ["first"])
  Project.setSource(project, "first", "x=1")
  Project.setSource(project, "second", "y=2")
  Project.setSource(project, "main", "z=3;y")

  test("runOrder", () => {
    expect(Project.getRunOrder(project)) == ["first", "second", "main"]
  })
  test("runOrderFor", () => {
    expect(Project.getRunOrderFor(project, "first")) == ["first"]
  })
  test("dependencies first", () => {
    expect(Project.getDependencies(project, "first")) == []
  })
  test("dependents first", () => {
    expect(Project.getDependents(project, "first")) == ["second", "main"]
  })
  test("dependents main", () => {
    expect(Project.getDependents(project, "main")) == []
  })
  test("dependencies main", () => {
    expect(Project.getDependencies(project, "main")) == ["first", "second"]
  })
  test("test result", () => {
    runFetchResult(project, "main")->expect->toBe("Ok(2)")
  })
  test("test bindings", () => {
    // bindings from continues are not exposed!
    runFetchFlatBindings(project, "main")->expect->toBe("{z: 3}")
  })
})

describe("removing sources", () => {
  let project = Project.createProject()
  Project.setContinues(project, "main", ["second"])
  Project.setContinues(project, "second", ["first"])
  Project.setSource(project, "first", "x=1")
  Project.setSource(project, "second", "y=2")
  Project.setSource(project, "main", "y")

  Project.removeSource(project, "main")

  test("project doesn't have source", () => {
    expect(Project.getSource(project, "main")) == None
  })

  test("dependents get updated", () => {
    expect(Project.getDependents(project, "second")) == []
  })
})

describe("project with include", () => {
  let project = Project.createProject()
  Project.setContinues(project, "main", ["second"])
  Project.setContinues(project, "second", ["first"])

  Project.setSource(
    project,
    "first",
    `
  #include 'common'
  x=1`,
  )
  Project.parseIncludes(project, "first")
  Project.parseIncludes(project, "first") //The only way of setting includes
  //Don't forget to parse includes after changing the source

  Project.setSource(project, "common", "common=0")
  Project.setSource(
    project,
    "second",
    `
  #include 'common'
  y=2`,
  )
  Project.parseIncludes(project, "second") //The only way of setting includes

  Project.setSource(project, "main", "z=3; y")

  test("runOrder", () => {
    expect(Project.getRunOrder(project)) == ["common", "first", "second", "main"]
  })

  test("runOrderFor", () => {
    expect(Project.getRunOrderFor(project, "first")) == ["common", "first"]
  })

  test("dependencies first", () => {
    expect(Project.getDependencies(project, "first")) == ["common"]
  })
  test("dependents first", () => {
    expect(Project.getDependents(project, "first")) == ["second", "main"]
  })
  test("dependents main", () => {
    expect(Project.getDependents(project, "main")) == []
  })
  test("dependencies main", () => {
    expect(Project.getDependencies(project, "main")) == ["common", "first", "second"]
  })
  test("test result", () => {
    runFetchResult(project, "main")->expect->toBe("Ok(2)")
  })
  test("test bindings", () => {
    // bindings from continues are not exposed!
    runFetchFlatBindings(project, "main")->expect->toBe("{z: 3}")
  })
})

describe("project with independent sources", () => {
  let project = Project.createProject()
  Project.setSource(project, "first", "1")
  Project.setSource(project, "second", "2")
  test("run order of first", () => {
    expect(Project.getRunOrderFor(project, "first")) == ["first"]
  })
  test("run order of second", () => {
    expect(Project.getRunOrderFor(project, "second")) == ["second"]
  })
})
