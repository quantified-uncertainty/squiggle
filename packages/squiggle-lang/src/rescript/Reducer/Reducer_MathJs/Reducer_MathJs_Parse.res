/*
  MathJs Nodes
  We make MathJs Nodes strong-typed
*/
module Extra = Reducer_Extra
open Reducer_ErrorValue

type node = {"type": string, "isNode": bool, "comment": string}
type arrayNode = {...node, "items": array<node>}
type block = {"node": node}
type blockNode = {...node, "blocks": array<block>}
//conditionalNode
type constantNode = {...node, "value": unit}
//functionAssignmentNode
type indexNode = {...node, "dimensions": array<node>}
type objectNode = {...node, "properties": Js.Dict.t<node>}
type accessorNode = {...node, "object": node, "index": indexNode, "name": string}

type parenthesisNode = {...node, "content": node}
//rangeNode
//relationalNode
type symbolNode = {...node, "name": string}
type functionNode = {...node, "fn": unit, "args": array<node>}
type operatorNode = {...functionNode, "op": string}
type assignmentNode = {...node, "object": symbolNode, "value": node}
type assignmentNodeWAccessor = {...node, "object": accessorNode, "value": node}
type assignmentNodeWIndex = {...assignmentNodeWAccessor, "index": Js.null<indexNode>}

external castAccessorNode: node => accessorNode = "%identity"
external castArrayNode: node => arrayNode = "%identity"
external castAssignmentNode: node => assignmentNode = "%identity"
external castAssignmentNodeWAccessor: node => assignmentNodeWAccessor = "%identity"
external castAssignmentNodeWIndex: node => assignmentNodeWIndex = "%identity"
external castBlockNode: node => blockNode = "%identity"
external castConstantNode: node => constantNode = "%identity"
external castFunctionNode: node => functionNode = "%identity"
external castIndexNode: node => indexNode = "%identity"
external castObjectNode: node => objectNode = "%identity"
external castOperatorNode: node => operatorNode = "%identity"
external castOperatorNodeToFunctionNode: operatorNode => functionNode = "%identity"
external castParenthesisNode: node => parenthesisNode = "%identity"
external castSymbolNode: node => symbolNode = "%identity"

/*
  MathJs Parser
*/
@module("mathjs") external parse__: string => node = "parse"

let parse = (expr: string): result<node, errorValue> =>
  try {
    Ok(parse__(expr))
  } catch {
  | Js.Exn.Error(obj) => REJavaScriptExn(Js.Exn.message(obj), Js.Exn.name(obj))->Error
  }

type mathJsNode =
  | MjAccessorNode(accessorNode)
  | MjArrayNode(arrayNode)
  | MjAssignmentNode(assignmentNode)
  | MjBlockNode(blockNode)
  | MjConstantNode(constantNode)
  | MjFunctionNode(functionNode)
  | MjIndexNode(indexNode)
  | MjObjectNode(objectNode)
  | MjOperatorNode(operatorNode)
  | MjParenthesisNode(parenthesisNode)
  | MjSymbolNode(symbolNode)

let castNodeType = (node: node) => {
  let decideAssignmentNode = node => {
    let iNode = node->castAssignmentNodeWIndex
    if Js.null == iNode["index"] && iNode["object"]["type"] == "SymbolNode" {
      node->castAssignmentNode->MjAssignmentNode->Ok
    } else {
      RESyntaxError("Assignment to index or property not supported")->Error
    }
  }

  switch node["type"] {
  | "AccessorNode" => node->castAccessorNode->MjAccessorNode->Ok
  | "ArrayNode" => node->castArrayNode->MjArrayNode->Ok
  | "AssignmentNode" => node->decideAssignmentNode
  | "BlockNode" => node->castBlockNode->MjBlockNode->Ok
  | "ConstantNode" => node->castConstantNode->MjConstantNode->Ok
  | "FunctionNode" => node->castFunctionNode->MjFunctionNode->Ok
  | "IndexNode" => node->castIndexNode->MjIndexNode->Ok
  | "ObjectNode" => node->castObjectNode->MjObjectNode->Ok
  | "OperatorNode" => node->castOperatorNode->MjOperatorNode->Ok
  | "ParenthesisNode" => node->castParenthesisNode->MjParenthesisNode->Ok
  | "SymbolNode" => node->castSymbolNode->MjSymbolNode->Ok
  | _ => RETodo(`Argg, unhandled MathJsNode: ${node["type"]}`)->Error
  }
}

external unitAsSymbolNode: unit => symbolNode = "%identity"
external unitAsString: unit => string = "%identity"

let nameOfFunctionNode = (fNode: functionNode): string => {
  let name = fNode["fn"]
  if Js.typeof(name) == "string" {
    name->unitAsString
  } else {
    (name->unitAsSymbolNode)["name"]
  }
}

let rec toString = (mathJsNode: mathJsNode): string => {
  let toStringValue = (a: 'a): string =>
    if Js.typeof(a) == "string" {
      `'${Js.String.make(a)}'`
    } else {
      Js.String.make(a)
    }

  let toStringNodeArray = (nodeArray: array<node>): string =>
    nodeArray
    ->Belt.Array.map(a => toStringMathJsNode(a))
    ->Extra.Array.interperse(", ")
    ->Js.String.concatMany("")

  let toStringFunctionNode = (fnode: functionNode): string =>
    `${fnode->nameOfFunctionNode}(${fnode["args"]->toStringNodeArray})`

  let toStringObjectEntry = ((key: string, value: node)): string =>
    `${key}: ${value->toStringMathJsNode}`

  let toStringObjectNode = (oNode: objectNode): string =>
    `{${oNode["properties"]
      ->Js.Dict.entries
      ->Belt.Array.map(entry => entry->toStringObjectEntry)
      ->Extra.Array.interperse(", ")
      ->Js.String.concatMany("")}}`

  let toStringIndexNode = (iNode: indexNode): string =>
    iNode["dimensions"]
    ->Belt.Array.map(each => toStringResult(each->castNodeType))
    ->Js.String.concatMany("")

  let toStringSymbolNode = (sNode: symbolNode): string => sNode["name"]

  let toStringBlocks = (blocks: array<block>): string =>
    blocks
    ->Belt.Array.map(each => each["node"]->castNodeType->toStringResult)
    ->Extra.Array.interperse("; ")
    ->Js.String.concatMany("")

  switch mathJsNode {
  | MjAccessorNode(aNode) =>
    `${aNode["object"]->toStringMathJsNode}[${aNode["index"]->toStringIndexNode}]`
  | MjArrayNode(aNode) => `[${aNode["items"]->toStringNodeArray}]`
  | MjAssignmentNode(aNode) =>
    `${aNode["object"]->toStringSymbolNode} = ${aNode["value"]->toStringMathJsNode}`
  | MjBlockNode(bNode) => `{${bNode["blocks"]->toStringBlocks}}`
  | MjConstantNode(cNode) => cNode["value"]->toStringValue
  | MjFunctionNode(fNode) => fNode->toStringFunctionNode
  | MjIndexNode(iNode) => iNode->toStringIndexNode
  | MjObjectNode(oNode) => oNode->toStringObjectNode
  | MjOperatorNode(opNode) => opNode->castOperatorNodeToFunctionNode->toStringFunctionNode
  | MjParenthesisNode(pNode) => `(${toStringMathJsNode(pNode["content"])})`
  | MjSymbolNode(sNode) => sNode->toStringSymbolNode
  }
}
and toStringResult = (rMathJsNode: result<mathJsNode, errorValue>): string =>
  switch rMathJsNode {
  | Error(e) => errorToString(e)
  | Ok(mathJsNode) => toString(mathJsNode)
  }
and toStringMathJsNode = node => node->castNodeType->toStringResult
