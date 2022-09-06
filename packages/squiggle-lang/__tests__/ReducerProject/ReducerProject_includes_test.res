@@warning("-44")
module InternalExpressionValue = ReducerInterface_InternalExpressionValue
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

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
    | Error(error) => fail(error->Reducer_ErrorValue.errorToString)
    }
  })
  let internalProject = project->Project.T.Private.castToInternalProject
  test("past chain", () => {
    expect(Project.Private.getPastChain(internalProject, "main")) == ["common"]
  })
  test("import as variables", () => {
    expect(Project.Private.getIncludesAsVariables(internalProject, "main")) == []
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
    | Error(error) => fail(error->Reducer_ErrorValue.errorToString)
    }
  })

  let internalProject = project->Project.T.Private.castToInternalProject

  test("direct past chain", () => {
    expect(Project.Private.getPastChain(internalProject, "main")) == ["common"]
  })

  test("direct includes", () => {
    expect(Project.Private.getDirectIncludes(internalProject, "main")) == ["common"]
  })

  test("include as variables", () => {
    expect(Project.Private.getIncludesAsVariables(internalProject, "main")) == [
        ("myVariable", "myModule"),
      ]
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
    | Error(error) => fail(error->Reducer_ErrorValue.errorToString)
    }
  })
  let internalProject = project->Project.T.Private.castToInternalProject
  test("direct past chain", () => {
    expect(Project.getPastChain(project, "main")) == ["common", "common2"]
  })
  test("include as variables", () => {
    expect(Project.Private.getIncludesAsVariables(internalProject, "main")) == [
        ("myVariable", "myModule"),
      ]
  })
})
