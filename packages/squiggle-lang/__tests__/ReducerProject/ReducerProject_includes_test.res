@@warning("-44")
module Project = ForTS_ReducerProject

open Jest
open Expect
open Expect.Operators

describe("Parse includes", () => {
  let project = Project.createProject()
  Project.setSource(
    project,
    "main",
    `
#include 'common'
x=1`,
  )
  Project.parseIncludes(project, "main")
  test("dependencies", () => {
    expect(Project.getDependencies(project, "main")) == ["common"]
  })
  test("dependents", () => {
    expect(Project.getDependents(project, "main")) == []
  })
  test("getIncludes", () => {
    let mainIncludes = Project.getIncludes(project, "main")
    switch mainIncludes {
    | Ok(includes) => expect(includes) == ["common"]
    | Error(error) => fail(error->SqError.toString)
    }
  })
  test("past chain", () => {
    expect(project->Project.getPastChain("main")) == ["common"]
  })
  test("import as variables", () => {
    expect(project->Project.Private.getIncludesAsVariables("main")) == []
  })
})

describe("Parse includes", () => {
  let project = Project.createProject()
  Project.setSource(
    project,
    "main",
    `
#include 'common'
#include 'myModule' as myVariable
x=1`,
  )
  Project.parseIncludes(project, "main")

  test("dependencies", () => {
    expect(Project.getDependencies(project, "main")) == ["common", "myModule"]
  })

  test("dependents", () => {
    expect(Project.getDependents(project, "main")) == []
  })

  test("getIncludes", () => {
    let mainIncludes = Project.getIncludes(project, "main")
    switch mainIncludes {
    | Ok(includes) => expect(includes) == ["common", "myModule"]
    | Error(error) => fail(error->SqError.toString)
    }
  })

  test("direct past chain", () => {
    expect(project->Project.Private.getPastChain("main")) == ["common"]
  })

  test("direct includes", () => {
    expect(project->Project.Private.getDirectIncludes("main")) == ["common"]
  })

  test("include as variables", () => {
    expect(project->Project.Private.getIncludesAsVariables("main")) == [("myVariable", "myModule")]
  })
})

describe("Parse multiple direct includes", () => {
  let project = Project.createProject()
  Project.setSource(
    project,
    "main",
    `
#include 'common' 
#include 'common2'
#include 'myModule' as myVariable
x=1`,
  )
  Project.parseIncludes(project, "main")
  test("dependencies", () => {
    expect(Project.getDependencies(project, "main")) == ["common", "common2", "myModule"]
  })
  test("dependents", () => {
    expect(Project.getDependents(project, "main")) == []
  })
  test("getIncludes", () => {
    let mainIncludes = Project.getIncludes(project, "main")
    switch mainIncludes {
    | Ok(includes) => expect(includes) == ["common", "common2", "myModule"]
    | Error(error) => fail(error->SqError.toString)
    }
  })
  test("direct past chain", () => {
    expect(Project.getPastChain(project, "main")) == ["common", "common2"]
  })
  test("include as variables", () => {
    expect(project->Project.Private.getIncludesAsVariables("main")) == [("myVariable", "myModule")]
  })
})
