module Extra = Reducer_Extra
open Reducer_ErrorValue

type node = {"type": string}

@module("./Reducer_Peggy_GeneratedParser.js") external parse__: string => node = "parse"

type withLocation = {"location": Reducer_ErrorValue.syntaxErrorLocation}
external castWithLocation: Js.Exn.t => withLocation = "%identity"

let syntaxErrorToLocation = (error: Js.Exn.t): Reducer_ErrorValue.syntaxErrorLocation =>
  castWithLocation(error)["location"]

let parse = (expr: string): result<node, errorValue> =>
  try {
    Ok(parse__(expr))
  } catch {
  | Js.Exn.Error(obj) =>
    RESyntaxError(Belt.Option.getExn(Js.Exn.message(obj)), syntaxErrorToLocation(obj)->Some)->Error
  }

type nodeBlock = {...node, "statements": array<node>}
type nodeProgram = {...node, "statements": array<node>}
type nodeArray = {...node, "elements": array<node>}
type nodeBoolean = {...node, "value": bool}
type nodeCall = {...node, "fn": node, "args": array<node>}
type nodeFloat = {...node, "value": float}
type nodeIdentifier = {...node, "value": string}
type nodeInteger = {...node, "value": int}
type nodeKeyValue = {...node, "key": node, "value": node}
type nodeRecord = {...node, "elements": array<nodeKeyValue>}
type nodeLambda = {...node, "args": array<nodeIdentifier>, "body": node}
type nodeLetStatement = {...node, "variable": nodeIdentifier, "value": node}
type nodeModuleIdentifier = {...node, "value": string}
type nodeString = {...node, "value": string}
type nodeTernary = {...node, "condition": node, "trueExpression": node, "falseExpression": node}
// type nodeTypeIdentifier = {...node, "value": string}
type nodeVoid = node

type peggyNode =
  | PgNodeBlock(nodeBlock)
  | PgNodeProgram(nodeProgram)
  | PgNodeArray(nodeArray)
  | PgNodeRecord(nodeRecord)
  | PgNodeBoolean(nodeBoolean)
  | PgNodeFloat(nodeFloat)
  | PgNodeCall(nodeCall)
  | PgNodeIdentifier(nodeIdentifier)
  | PgNodeInteger(nodeInteger)
  | PgNodeKeyValue(nodeKeyValue)
  | PgNodeLambda(nodeLambda)
  | PgNodeLetStatement(nodeLetStatement)
  | PgNodeModuleIdentifier(nodeModuleIdentifier)
  | PgNodeString(nodeString)
  | PgNodeTernary(nodeTernary)
  // | PgNodeTypeIdentifier(nodeTypeIdentifier)
  | PgNodeVoid(nodeVoid)

external castNodeBlock: node => nodeBlock = "%identity"
external castNodeProgram: node => nodeProgram = "%identity"
external castNodeArray: node => nodeArray = "%identity"
external castNodeRecord: node => nodeRecord = "%identity"
external castNodeBoolean: node => nodeBoolean = "%identity"
external castNodeCall: node => nodeCall = "%identity"
external castNodeFloat: node => nodeFloat = "%identity"
external castNodeIdentifier: node => nodeIdentifier = "%identity"
external castNodeInteger: node => nodeInteger = "%identity"
external castNodeKeyValue: node => nodeKeyValue = "%identity"
external castNodeLambda: node => nodeLambda = "%identity"
external castNodeLetStatement: node => nodeLetStatement = "%identity"
external castNodeModuleIdentifier: node => nodeModuleIdentifier = "%identity"
external castNodeString: node => nodeString = "%identity"
external castNodeTernary: node => nodeTernary = "%identity"
// external castNodeTypeIdentifier: node => nodeTypeIdentifier = "%identity"
external castNodeVoid: node => nodeVoid = "%identity"

exception UnsupportedPeggyNodeType(string) // This should never happen; programming error
let castNodeType = (node: node) =>
  switch node["type"] {
  | "Block" => node->castNodeBlock->PgNodeBlock
  | "Program" => node->castNodeBlock->PgNodeProgram
  | "Array" => node->castNodeArray->PgNodeArray
  | "Record" => node->castNodeRecord->PgNodeRecord
  | "Boolean" => node->castNodeBoolean->PgNodeBoolean
  | "Call" => node->castNodeCall->PgNodeCall
  | "Float" => node->castNodeFloat->PgNodeFloat
  | "Identifier" => node->castNodeIdentifier->PgNodeIdentifier
  | "Integer" => node->castNodeInteger->PgNodeInteger
  | "KeyValue" => node->castNodeKeyValue->PgNodeKeyValue
  | "Lambda" => node->castNodeLambda->PgNodeLambda
  | "LetStatement" => node->castNodeLetStatement->PgNodeLetStatement
  | "ModuleIdentifier" => node->castNodeModuleIdentifier->PgNodeModuleIdentifier
  | "String" => node->castNodeString->PgNodeString
  | "Ternary" => node->castNodeTernary->PgNodeTernary
  // | "TypeIdentifier" => node->castNodeTypeIdentifier->PgNodeTypeIdentifier
  | "Void" => node->castNodeVoid->PgNodeVoid
  | _ => raise(UnsupportedPeggyNodeType(node["type"]))
  }

let rec pgToString = (peggyNode: peggyNode): string => {
  let argsToString = (args: array<nodeIdentifier>): string =>
    args->Js.Array2.map(arg => PgNodeIdentifier(arg)->pgToString)->Js.Array2.toString

  let nodesToStringUsingSeparator = (nodes: array<node>, separator: string): string =>
    nodes->Js.Array2.map(toString)->Extra.Array.intersperse(separator)->Js.String.concatMany("")

  let pgNodesToStringUsingSeparator = (nodes: array<peggyNode>, separator: string): string =>
    nodes->Js.Array2.map(pgToString)->Extra.Array.intersperse(separator)->Js.String.concatMany("")

  switch peggyNode {
  | PgNodeBlock(node)
  | PgNodeProgram(node) =>
    "{" ++ node["statements"]->nodesToStringUsingSeparator("; ") ++ "}"
  | PgNodeArray(node) => "[" ++ node["elements"]->nodesToStringUsingSeparator("; ") ++ "]"
  | PgNodeRecord(node) =>
    "{" ++
    node["elements"]
    ->Js.Array2.map(element => PgNodeKeyValue(element))
    ->pgNodesToStringUsingSeparator(", ") ++ "}"
  | PgNodeBoolean(node) => node["value"]->Js.String.make
  | PgNodeCall(node) =>
    "(" ++ node["fn"]->toString ++ " " ++ node["args"]->nodesToStringUsingSeparator(" ") ++ ")"
  | PgNodeFloat(node) => node["value"]->Js.String.make
  | PgNodeIdentifier(node) => `:${node["value"]}`
  | PgNodeInteger(node) => node["value"]->Js.String.make
  | PgNodeKeyValue(node) => toString(node["key"]) ++ ": " ++ toString(node["value"])
  | PgNodeLambda(node) =>
    "{|" ++ node["args"]->argsToString ++ "| " ++ node["body"]->toString ++ "}"
  | PgNodeLetStatement(node) =>
    pgToString(PgNodeIdentifier(node["variable"])) ++ " = " ++ toString(node["value"])
  | PgNodeModuleIdentifier(node) => `@${node["value"]}`
  | PgNodeString(node) => `'${node["value"]->Js.String.make}'`
  | PgNodeTernary(node) =>
    "(::$$_ternary_$$ " ++
    toString(node["condition"]) ++
    " " ++
    toString(node["trueExpression"]) ++
    " " ++
    toString(node["falseExpression"]) ++ ")"
  // | PgNodeTypeIdentifier(node) => `#${node["value"]}`
  | PgNodeVoid(_node) => "()"
  }
}
and toString = (node: node): string => node->castNodeType->pgToString

let toStringResult = (rNode: result<node, errorValue>): string =>
  switch rNode {
  | Ok(node) => toString(node)
  | Error(error) => `Error(${errorToString(error)})`
  }
