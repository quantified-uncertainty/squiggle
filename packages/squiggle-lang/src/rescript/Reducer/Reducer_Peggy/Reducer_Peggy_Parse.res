module Extra = Reducer_Extra
open Reducer_ErrorValue

type node = {"type": string}

@module("./Reducer_Peggy_GeneratedParser.js") external parse__: string => node = "parse"

type withLocation = {"location": Reducer_ErrorValue.location}
external castWithLocation: Js.Exn.t => withLocation = "%identity"

let syntaxErrorToLocation = (error: Js.Exn.t): Reducer_ErrorValue.location =>
  castWithLocation(error)["location"]

@genType
let parse = (expr: string): result<node, errorValue> =>
  try {
    Ok(parse__(expr))
  } catch {
  | Js.Exn.Error(obj) =>
    RESyntaxError(Belt.Option.getExn(Js.Exn.message(obj)), syntaxErrorToLocation(obj)->Some)->Error
  }

type nodeBlock = {...node, "statements": array<node>}
type nodeBoolean = {...node, "value": bool}
type nodeCallIdentifier = {...node, "value": string}
type nodeExpression = {...node, "nodes": array<node>}
type nodeFloat = {...node, "value": float}
type nodeIdentifier = {...node, "value": string}
type nodeInteger = {...node, "value": int}
type nodeKeyValue = {...node, "key": node, "value": node}
type nodeLambda = {...node, "args": array<nodeIdentifier>, "body": nodeBlock}
type nodeLetStatement = {...node, "variable": nodeIdentifier, "value": node}
type nodeModuleIdentifier = {...node, "value": string}
type nodeString = {...node, "value": string}
type nodeTernary = {...node, "condition": node, "trueExpression": node, "falseExpression": node}
type nodeTypeIdentifier = {...node, "value": string}

type peggyNode =
  | PgNodeBlock(nodeBlock)
  | PgNodeBoolean(nodeBoolean)
  | PgNodeCallIdentifier(nodeCallIdentifier)
  | PgNodeExpression(nodeExpression)
  | PgNodeFloat(nodeFloat)
  | PgNodeIdentifier(nodeIdentifier)
  | PgNodeInteger(nodeInteger)
  | PgNodeKeyValue(nodeKeyValue)
  | PgNodeLambda(nodeLambda)
  | PgNodeLetStatement(nodeLetStatement)
  | PgNodeModuleIdentifier(nodeModuleIdentifier)
  | PgNodeString(nodeString)
  | PgNodeTernary(nodeTernary)
  | PgNodeTypeIdentifier(nodeTypeIdentifier)

external castNodeBlock: node => nodeBlock = "%identity"
external castNodeBoolean: node => nodeBoolean = "%identity"
external castNodeCallIdentifier: node => nodeCallIdentifier = "%identity"
external castNodeExpression: node => nodeExpression = "%identity"
external castNodeFloat: node => nodeFloat = "%identity"
external castNodeIdentifier: node => nodeIdentifier = "%identity"
external castNodeInteger: node => nodeInteger = "%identity"
external castNodeKeyValue: node => nodeKeyValue = "%identity"
external castNodeLambda: node => nodeLambda = "%identity"
external castNodeLetStatement: node => nodeLetStatement = "%identity"
external castNodeModuleIdentifier: node => nodeModuleIdentifier = "%identity"
external castNodeString: node => nodeString = "%identity"
external castNodeTernary: node => nodeTernary = "%identity"
external castNodeTypeIdentifier: node => nodeTypeIdentifier = "%identity"

exception UnsupportedPeggyNodeType(string) // This should never happen; programming error
let castNodeType = (node: node) =>
  switch node["type"] {
  | "Block" => node->castNodeBlock->PgNodeBlock
  | "Boolean" => node->castNodeBoolean->PgNodeBoolean
  | "CallIdentifier" => node->castNodeCallIdentifier->PgNodeCallIdentifier
  | "Expression" => node->castNodeExpression->PgNodeExpression
  | "Float" => node->castNodeFloat->PgNodeFloat
  | "Identifier" => node->castNodeIdentifier->PgNodeIdentifier
  | "Integer" => node->castNodeInteger->PgNodeInteger
  | "KeyValue" => node->castNodeKeyValue->PgNodeKeyValue
  | "Lambda" => node->castNodeLambda->PgNodeLambda
  | "LetStatement" => node->castNodeLetStatement->PgNodeLetStatement
  | "ModuleIdentifier" => node->castNodeModuleIdentifier->PgNodeModuleIdentifier
  | "String" => node->castNodeString->PgNodeString
  | "Ternary" => node->castNodeTernary->PgNodeTernary
  | "TypeIdentifier" => node->castNodeTypeIdentifier->PgNodeTypeIdentifier
  | _ => raise(UnsupportedPeggyNodeType(node["type"]))
  }

let rec pgToString = (peggyNode: peggyNode): string => {
  let argsToString = (args: array<nodeIdentifier>): string =>
    args->Js.Array2.map(arg => PgNodeIdentifier(arg)->pgToString)->Js.Array2.toString

  let nodesToStringUsingSeparator = (nodes: array<node>, separator: string): string =>
    nodes->Js.Array2.map(toString)->Extra.Array.interperse(separator)->Js.String.concatMany("")

  switch peggyNode {
  | PgNodeBlock(node) => "{" ++ node["statements"]->nodesToStringUsingSeparator("; ") ++ "}"
  | PgNodeBoolean(node) => node["value"]->Js.String.make
  | PgNodeCallIdentifier(node) => `::${Js.String.make(node["value"])}` // This is an identifier also but for function names
  | PgNodeExpression(node) => "(" ++ node["nodes"]->nodesToStringUsingSeparator(" ") ++ ")"
  | PgNodeFloat(node) => node["value"]->Js.String.make
  | PgNodeIdentifier(node) => `:${node["value"]}`
  | PgNodeInteger(node) => node["value"]->Js.String.make
  | PgNodeKeyValue(node) => toString(node["key"]) ++ ": " ++ toString(node["value"])
  | PgNodeLambda(node) =>
    "{|" ++ node["args"]->argsToString ++ "| " ++ pgToString(PgNodeBlock(node["body"])) ++ "}"
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
  | PgNodeTypeIdentifier(node) => `#${node["value"]}`
  }
}
and toString = (node: node): string => node->castNodeType->pgToString

let toStringResult = (rNode: result<node, errorValue>): string =>
  switch rNode {
  | Ok(node) => toString(node)
  | Error(error) => `Error(${errorToString(error)})`
  }
