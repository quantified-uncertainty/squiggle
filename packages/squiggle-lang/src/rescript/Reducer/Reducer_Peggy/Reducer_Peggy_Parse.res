module Extra = Reducer_Extra

@genType
type locationPoint = {
  line: int,
  column: int,
}
@genType
type location = {
  source: string,
  start: locationPoint,
  end: locationPoint,
}

type node = {"type": string, "location": location}

module ParseError = {
  @genType.opaque
  type t = SyntaxError(string, location)

  @genType
  let getMessage = (SyntaxError(message, _): t) => message

  @genType
  let getLocation = (SyntaxError(_, location): t) => location
}

type parseError = ParseError.t

type parseResult = result<node, parseError>

@module("./Reducer_Peggy_GeneratedParser.js")
external parse__: (string, {"grammarSource": string}) => node = "parse"

type withLocation = {"location": location}
external castWithLocation: Js.Exn.t => withLocation = "%identity"

let syntaxErrorToLocation = (error: Js.Exn.t): location => castWithLocation(error)["location"]

@genType
let parse = (expr: string, source: string): parseResult =>
  try {
    Ok(parse__(expr, {"grammarSource": source}))
  } catch {
  | Js.Exn.Error(obj) =>
    SyntaxError(Belt.Option.getExn(Js.Exn.message(obj)), syntaxErrorToLocation(obj))->Error
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
type nodeLambda = {...node, "args": array<nodeIdentifier>, "body": node, "name": option<string>}
type nodeLetStatement = {...node, "variable": nodeIdentifier, "value": node}
type nodeModuleIdentifier = {...node, "value": string}
type nodeString = {...node, "value": string}
type nodeTernary = {...node, "condition": node, "trueExpression": node, "falseExpression": node}
type nodeVoid = node

type astContent =
  | ASTBlock(nodeBlock)
  | ASTProgram(nodeProgram)
  | ASTArray(nodeArray)
  | ASTRecord(nodeRecord)
  | ASTBoolean(nodeBoolean)
  | ASTFloat(nodeFloat)
  | ASTCall(nodeCall)
  | ASTIdentifier(nodeIdentifier)
  | ASTInteger(nodeInteger)
  | ASTKeyValue(nodeKeyValue)
  | ASTLambda(nodeLambda)
  | ASTLetStatement(nodeLetStatement)
  | ASTModuleIdentifier(nodeModuleIdentifier)
  | ASTString(nodeString)
  | ASTTernary(nodeTernary)
  | ASTVoid(nodeVoid)

type ast = {
  location: location,
  content: astContent,
}

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
external castNodeVoid: node => nodeVoid = "%identity"

exception UnsupportedPeggyNodeType(string) // This should never happen; programming error
let nodeToAST = (node: node) => {
  let content = switch node["type"] {
  | "Block" => node->castNodeBlock->ASTBlock
  | "Program" => node->castNodeBlock->ASTProgram
  | "Array" => node->castNodeArray->ASTArray
  | "Record" => node->castNodeRecord->ASTRecord
  | "Boolean" => node->castNodeBoolean->ASTBoolean
  | "Call" => node->castNodeCall->ASTCall
  | "Float" => node->castNodeFloat->ASTFloat
  | "Identifier" => node->castNodeIdentifier->ASTIdentifier
  | "Integer" => node->castNodeInteger->ASTInteger
  | "KeyValue" => node->castNodeKeyValue->ASTKeyValue
  | "Lambda" => node->castNodeLambda->ASTLambda
  | "LetStatement" => node->castNodeLetStatement->ASTLetStatement
  | "ModuleIdentifier" => node->castNodeModuleIdentifier->ASTModuleIdentifier
  | "String" => node->castNodeString->ASTString
  | "Ternary" => node->castNodeTernary->ASTTernary
  | "Void" => node->castNodeVoid->ASTVoid
  | _ => raise(UnsupportedPeggyNodeType(node["type"]))
  }

  {location: node["location"], content}
}

let nodeIdentifierToAST = (node: nodeIdentifier) => {
  {location: node["location"], content: node->ASTIdentifier}
}

let nodeKeyValueToAST = (node: nodeKeyValue) => {
  {location: node["location"], content: node->ASTKeyValue}
}

let rec pgToString = (ast: ast): string => {
  let argsToString = (args: array<nodeIdentifier>): string =>
    args->E.A.fmap(arg => arg->nodeIdentifierToAST->pgToString)->Js.Array2.toString

  let nodesToStringUsingSeparator = (nodes: array<node>, separator: string): string =>
    nodes->E.A.fmap(toString)->Extra.Array.intersperse(separator)->Js.String.concatMany("")

  let pgNodesToStringUsingSeparator = (nodes: array<ast>, separator: string): string =>
    nodes->E.A.fmap(pgToString)->Extra.Array.intersperse(separator)->Js.String.concatMany("")

  switch ast.content {
  | ASTBlock(node)
  | ASTProgram(node) =>
    "{" ++ node["statements"]->nodesToStringUsingSeparator("; ") ++ "}"
  | ASTArray(node) => "[" ++ node["elements"]->nodesToStringUsingSeparator("; ") ++ "]"
  | ASTRecord(node) =>
    "{" ++
    node["elements"]
    ->E.A.fmap(element => element->nodeKeyValueToAST)
    ->pgNodesToStringUsingSeparator(", ") ++ "}"
  | ASTBoolean(node) => node["value"]->Js.String.make
  | ASTCall(node) =>
    "(" ++ node["fn"]->toString ++ " " ++ node["args"]->nodesToStringUsingSeparator(" ") ++ ")"
  | ASTFloat(node) => node["value"]->Js.String.make
  | ASTIdentifier(node) => `:${node["value"]}`
  | ASTInteger(node) => node["value"]->Js.String.make
  | ASTKeyValue(node) => toString(node["key"]) ++ ": " ++ toString(node["value"])
  | ASTLambda(node) => "{|" ++ node["args"]->argsToString ++ "| " ++ node["body"]->toString ++ "}"
  | ASTLetStatement(node) =>
    pgToString(node["variable"]->nodeIdentifierToAST) ++ " = " ++ toString(node["value"])
  | ASTModuleIdentifier(node) => `@${node["value"]}`
  | ASTString(node) => `'${node["value"]->Js.String.make}'`
  | ASTTernary(node) =>
    "(::$$_ternary_$$ " ++
    toString(node["condition"]) ++
    " " ++
    toString(node["trueExpression"]) ++
    " " ++
    toString(node["falseExpression"]) ++ ")"
  | ASTVoid(_node) => "()"
  }
}
and toString = (node: node): string => node->nodeToAST->pgToString

let toStringError = (error: parseError): string => {
  let ParseError.SyntaxError(message, _) = error
  `Syntax Error: ${message}}`
}

let toStringResult = (rNode: parseResult): string =>
  switch rNode {
  | Ok(node) => node->toString
  | Error(error) => `Error(${error->toStringError})`
  }
