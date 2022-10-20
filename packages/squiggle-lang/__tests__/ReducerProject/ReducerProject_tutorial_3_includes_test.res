@@warning("-44")
module Project = ForTS_ReducerProject
module Bindings = Reducer_Bindings

open Jest
open Expect
open Expect.Operators

describe("ReducerProject Tutorial", () => {
  /* Case: Includes
In the previous tutorial we have set the similarity between setContinues and parseIncludes.
Here we will finally proceed to a real life scenario. */

  describe("parseIncludes", () => {
    /* Here we investigate the details about parseIncludes, before setting up a real life scenario in the next section. */
    /* Everything happens inside a project, so let's have a project */
    let project = Project.createProject()
    project->Project.setSource(
      "main",
      `
    #include "common"
    x=1
    `,
    )
    /* We need to parse includes after changing the source */
    project->Project.parseIncludes("main")
    test(
      "getDependencies",
      () => {
        /* Parse includes has set the dependencies */
        project->Project.getDependencies("main")->expect == ["common"]
        /* If there were no includes than there would be no dependencies */
        /* However if there was a syntax error at includes then would be no dependencies also */
        /* Therefore looking at dependencies is not the right way to load includes */
        /* getDependencies does not distinguish between setContinues or parseIncludes */
      },
    )
    test(
      "getIncludes",
      () => {
        /* Parse includes has set the includes */
        switch project->Project.getIncludes("main") {
        | Ok(includes) => includes->expect == ["common"]
        | Error(err) => err->SqError.toString->fail
        }
        /* If the includes cannot be parsed then you get a syntax error.
      Otherwise you get the includes.
      If there is no syntax error then you can load that file and use setSource to add it to the project.
      And so on recursively... */
      },
    )
    test(
      "getDependents",
      () => {
        /* For any reason, you are able to query what other sources
        include or depend on the current source.
        But you don't need to use this to execute the projects.
        It is provided for completeness of information. */
        project->Project.getDependents("main")->expect == []
        /* Nothing is depending on or including main */
      },
    )

    describe(
      "Real Like",
      () => {
        /* Now let's look at recursive and possibly cyclic includes */
        /* There is no function provided to load the include files.
    Because we have no idea if will it be an ordinary function or will it use promises.
    Therefore one has to write a function to load sources recursively and and setSources
    while checking for dependencies */

        /* Let's make a dummy loader */
        let loadSource = (sourceName: string) =>
          switch sourceName {
          | "source1" => "x=1"
          | "source2" => `
            #include "source1"
            y=2`
          | "source3" => `
            #include "source2"
            z=3`
          | _ => `source ${sourceName} not found`->Js.Exn.raiseError
          }

        /* let's recursively load the sources */
        let rec loadIncludesRecursively = (project, sourceName, visited) => {
          if visited->Js.Array2.includes(sourceName) {
            /* Oh we have already visited this source. There is an include cycle */
            "Cyclic include ${sourceName}"->Js.Exn.raiseError
          } else {
            let newVisited = Js.Array2.copy(visited)
            let _ = newVisited->Js.Array2.push(sourceName)
            /* Let's parse the includes and dive into them */
            Project.parseIncludes(project, sourceName)
            let rIncludes = project->Project.getIncludes(sourceName)
            switch rIncludes {
            /* Maybe there is an include syntax error */
            | Error(err) => err->SqError.toString->Js.Exn.raiseError

            | Ok(includes) =>
              includes->E.A.forEach(
                newIncludeName => {
                  /* We have got one of the new includes.
                   Let's load it and add it to the project */
                  let newSource = loadSource(newIncludeName)
                  project->Project.setSource(newIncludeName, newSource)
                  /* The new source is loaded and added to the project. */
                  /* Of course the new source might have includes too. */
                  /* Let's recursively load them */
                  project->loadIncludesRecursively(newIncludeName, newVisited)
                },
              )
            }
          }
        }
        /* As we have a fake source loader and a recursive include handler,
         We can not set up a real project */

        /* * Here starts our real life project! * */

        let project = Project.createProject()

        project->Project.setSource(
          "main",
          `
        #include "source1"
        #include "source2"
        #include "source3"
        a = x+y+z
        b = doubleX
        a
        `,
        )
        /* Setting source requires parsing and loading the includes recursively */
        project->loadIncludesRecursively("main", []) // Not visited yet

        /* Let's salt it more. Let's have another source in the project which also has includes */
        /* doubleX includes source1 which is eventually included by main as well */
        project->Project.setSource(
          "doubleX",
          `
        #include "source1"
        doubleX = x * 2
        `,
        )
        project->loadIncludesRecursively("doubleX", [])
        /* Remember, any time you set a source, you need to load includes recursively */

        /* As doubleX is not included by main, it is not loaded recursively.
         So we link it to the project as a dependency */
        project->Project.setContinues("main", ["doubleX"])

        /* Let's run the project */
        project->Project.runAll
        let result = project->Project.getResult("main")
        let bindings = project->Project.getBindings("main")
        /* And see the result and bindings.. */
        test(
          "recursive includes",
          () => {
            (
              result->Reducer_Value.toStringResult,
              bindings->Reducer_Value.toStringRecord,
            )->expect == ("Ok(6)", "{a: 6,b: 2}")
            /* Everything as expected */
          },
        )
      },
    )
  })

  describe("Includes myFile as myVariable", () => {
    /* Instead of including into global space you can also put a module into a record variable */
    let project = Project.createProject()
    Project.setSource(
      project,
      "main",
      `
    #include "common" as common
    x=1
    `,
    )
    Project.parseIncludes(project, "main")
    test(
      "getDependencies",
      () => {
        Project.getDependencies(project, "main")->expect == ["common"]
      },
    )
    test(
      "getIncludes",
      () => {
        switch Project.getIncludes(project, "main") {
        | Ok(includes) => includes->expect == ["common"]
        | Error(err) => err->SqError.toString->fail
        }
      },
    )
  })
})
