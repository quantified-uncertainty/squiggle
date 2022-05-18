module Extra = Reducer_Extra
open Reducer_ErrorValue

type node = {"type": string}

@module("./Reducer_Peggy_GeneratedParser.js") external parse__: string => node = "parse"

let parse = (expr: string): result<node, errorValue> =>
  try {
    Ok(parse__(expr))
  } catch {
  | Js.Exn.Error(obj) => REJavaScriptExn(Js.Exn.message(obj), Js.Exn.name(obj))->Error
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
type nodeString = {...node, "value": string}
type nodeTernary = {...node, "condition": node, "trueExpression": node, "falseExpression": node}

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
  | PgNodeString(nodeString)
  | PgNodeTernary(nodeTernary)

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
external castNodeString: node => nodeString = "%identity"
external castNodeTernary: node => nodeTernary = "%identity"

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
  | "String" => node->castNodeString->PgNodeString
  | "Ternary" => node->castNodeTernary->PgNodeTernary
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
  | PgNodeString(node) => `'${node["value"]->Js.String.make}'`
  | PgNodeTernary(node) =>
    "(::$$ternary " ++
    toString(node["condition"]) ++
    " " ++
    toString(node["trueExpression"]) ++
    " " ++
    toString(node["falseExpression"]) ++ ")"
  }
}
and toString = (node: node): string => node->castNodeType->pgToString

let toStringResult = (rNode: result<node, errorValue>): string =>
  switch rNode {
  | Ok(node) => toString(node)
  | Error(error) => `Error(${errorToString(error)})`
  }
