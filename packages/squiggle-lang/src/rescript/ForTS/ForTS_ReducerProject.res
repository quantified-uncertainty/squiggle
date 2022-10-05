@genType type reducerProject = ReducerProject_T.project //re-export

type error = SqError.t //use
type errorMessage = SqError.Message.t //use

type squiggleValue = ForTS_SquiggleValue.squiggleValue //use
type squiggleValue_Record = ForTS_SquiggleValue.squiggleValue_Record //use

type environment = ForTS_Distribution_Environment.environment //use

module T = ReducerProject_T
module Private = ReducerProject

/*
  PUBLIC FUNCTIONS
*/

/*
A project links and runs sources that continue or include each other.

Creates a new project to hold the sources, executables, bindings, and other data. 
The new project runs the sources according to their topological sorting because of the includes and continues.

Any source can include or continue other sources. "Therefore, the project is a graph data structure."
The difference between including and continuing is that includes are stated inside the source code while continues are stated in the project.

To run a group of source codes and get results/bindings, the necessary methods are
- setSource
- setContinues
- parseIncludes
- run or runAll
- getExternalBindings
- getExternalResult

A project has a public field tag with a constant value "reducerProject"
project = {tag: "reducerProject"}
*/
@genType
let createProject = (): reducerProject => Private.createProject()

/*
Answer all the source ids of all the sources in the project.
*/
@genType
let getSourceIds = (project: reducerProject): array<string> => project->Private.getSourceIds

/*
Sets the source for a given source Id.
*/
@genType
let setSource = (project: reducerProject, sourceId: string, value: string): unit =>
  project->Private.setSource(sourceId, value)

/*
Removes the source for a given source Id.
*/
@genType
let removeSource = (project: reducerProject, sourceId: string): unit =>
  project->Private.removeSource(sourceId)

/*
Gets the source for a given source id.
*/
@genType
let getSource = (project: reducerProject, sourceId: string): option<string> =>
  project->Private.getSource(sourceId)

/*
Touches the source for a given source id. This and dependent, sources are set to be re-evaluated.
*/
@genType
let touchSource = (project: reducerProject, sourceId: string): unit =>
  project->Private.touchSource(sourceId)

/*
Cleans the compilation artifacts for a given source ID. The results stay untouched, so compilation won't be run again.

Normally, you would never need the compilation artifacts again as the results with the same sources would never change. However, they are needed in case of any debugging reruns
*/
@genType
let clean = (project: reducerProject, sourceId: string): unit => project->Private.clean(sourceId)

/*
Cleans all the compilation artifacts in all of the project
*/
@genType
let cleanAll = (project: reducerProject): unit => project->Private.cleanAll

/*
Cleans results. Compilation stays untouched to be able to re-run the source.
You would not do this if you were not trying to debug the source code.
*/
@genType
let cleanResults = (project: reducerProject, sourceId: string): unit =>
  project->Private.cleanResults(sourceId)

/*
Cleans all results. Compilations remains untouched to rerun the source.
*/
@genType
let cleanAllResults = (project: reducerProject): unit => project->Private.cleanAllResults

/*
To set the includes one first has to call "parseIncludes". The parsed includes or the parser error is returned.
*/
@genType
let getIncludes = (project: reducerProject, sourceId: string): result<array<string>, error> =>
  project->Private.getIncludes(sourceId)

/* Other sources contributing to the global namespace of this source. */
@genType
let getPastChain = (project: reducerProject, sourceId: string): array<string> =>
  project->Private.getPastChain(sourceId)

/*
Answers the source codes after which this source code is continuing
*/
@genType
let getContinues = (project: reducerProject, sourceId: string): array<string> =>
  project->Private.getContinues(sourceId)

/*
 "continues" acts like hidden includes in the source. 
 It is used to define a continuation that is not visible in the source code. 
 You can chain source codes on the web interface for example
*/
@genType
let setContinues = (project: reducerProject, sourceId: string, continues: array<string>): unit =>
  project->Private.setContinues(sourceId, continues)

/*
This source depends on the array of sources returned.
*/
@genType
let getDependencies = (project: reducerProject, sourceId: string): array<string> =>
  project->Private.getDependencies(sourceId)

/*
The sources returned are dependent on this
*/
@genType
let getDependents = (project: reducerProject, sourceId: string): array<string> =>
  project->Private.getDependents(sourceId)

/*
Get the run order for the sources in the project.
*/
@genType
let getRunOrder = (project: reducerProject): array<string> => project->Private.getRunOrder

/*
Get the run order to get the results of this specific source
*/
@genType
let getRunOrderFor = (project: reducerProject, sourceId: string) =>
  project->Private.getRunOrderFor(sourceId)

/*
Parse includes so that you can load them before running. 
Load includes by calling getIncludes which returns the includes that have been parsed. 
It is your responsibility to load the includes before running.
*/

@genType
let parseIncludes = (project: reducerProject, sourceId: string): unit =>
  project->Private.parseIncludes(sourceId)

/*
Parse the source code if it is not done already. 
Use getRawParse to get the parse tree. 
You would need this function if you want to see the parse tree without running the source code.
*/
@genType
let rawParse = (project: reducerProject, sourceId: string): unit =>
  project->Private.rawParse(sourceId)

/*
Runs a specific source code if it is not done already. The code is parsed if it is not already done. It runs the dependencies if it is not already done.
*/
@genType
let run = (project: reducerProject, sourceId: string): unit => project->Private.run(sourceId)

/*
Runs all of the sources in a project. Their results and bindings will be available
*/
@genType
let runAll = (project: reducerProject): unit => project->Private.runAll

/*
Get the bindings after running this source fil. The bindings are local to the source
*/
@genType
let getBindings = (project: reducerProject, sourceId: string): squiggleValue_Record =>
  project->Private.getBindings(sourceId)->Reducer_Namespace.toMap

/*
Get the result after running this source file or the project
*/
@genType
let getResult = (project: reducerProject, sourceId: string): result<squiggleValue, error> =>
  project->Private.getResult(sourceId)

/*
This is a convenience function to get the result of a single source without creating a project. 
However, without a project, you cannot handle include directives.
The source has to be include free
*/
@genType
let evaluate = (sourceCode: string): (result<squiggleValue, error>, squiggleValue_Record) =>
  Private.evaluate(sourceCode)

@genType
let setEnvironment = (project: reducerProject, environment: environment): unit =>
  project->Private.setEnvironment(environment)

@genType
let getEnvironment = (project: reducerProject): environment => project->Private.getEnvironment
