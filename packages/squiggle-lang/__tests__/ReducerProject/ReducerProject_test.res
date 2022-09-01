@@warning("-44")
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

// test("", () => expect(1)->toBe(1))

let runFetchResult = (project, sourceId) => {
  Project.run(project, sourceId)
  Project.getResult(project, sourceId)->InternalExpressionValue.toStringResult
}

let runFetchFlatBindings = (project, sourceId) => {
  Project.run(project, sourceId)
  Project.getBindings(project, sourceId)
  ->Bindings.removeResult
  ->InternalExpressionValue.toStringBindings
}

test("setting continuation", () => {
  let project = Project.createProject()
  let privateProject = project->Project.T.Private.castToInternalProject
  let sampleBindings = Bindings.emptyBindings->Bindings.set("test", IEvVoid)
  Project.Private.setContinuation(privateProject, "main", sampleBindings)
  let answer = Project.Private.getContinuation(privateProject, "main")
  expect(answer)->toBe(sampleBindings)
})

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
  runFetchFlatBindings(project, "variables")->expect->toBe("@{myVariable: 666}")
})

describe("project1", () => {
  let project = Project.createProject()
  Project.setSource(project, "first", "x=1")
  Project.setSource(project, "main", "x")
  Project.setContinues(project, "main", ["first"])
  let internalProject = project->Project.T.Private.castToInternalProject

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
    expect(Project.Private.getPastChain(internalProject, "first")) == []
  })
  test("past chain main", () => {
    expect(Project.Private.getPastChain(internalProject, "main")) == ["first"]
  })

  test("test result", () => {
    runFetchResult(project, "main")->expect->toBe("Ok(1)")
  })
  test("test bindings", () => {
    runFetchFlatBindings(project, "first")->expect->toBe("@{x: 1}")
  })
})

describe("project2", () => {
  let project = Project.createProject()
  Project.setContinues(project, "main", ["second"])
  Project.setContinues(project, "second", ["first"])
  Project.setSource(project, "first", "x=1")
  Project.setSource(project, "second", "y=2")
  Project.setSource(project, "main", "y")

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
    runFetchFlatBindings(project, "main")->expect->toBe("@{x: 1,y: 2}")
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

  Project.setSource(project, "main", "y")

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
    runFetchFlatBindings(project, "main")->expect->toBe("@{common: 0,x: 1,y: 2}")
  })
})

describe("project with independent sources", () => {
  let project = Project.createProject()
  Project.setSource(project, "first", "1")
  Project.setSource(project, "second", "2")
  test("first run order", () => {
    expect(Project.getRunOrderFor(project, "first")) == ["first"]
  })
  test("second run order", () => {
    expect(Project.getRunOrderFor(project, "second")) == ["second"]
  })
})
