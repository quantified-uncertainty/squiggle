/*
  MathJs Nodes
  We make MathJs Nodes strong-typed
*/
module Extra = Reducer_Extra
open Reducer_ErrorValue

type node = {"type": string, "isNode": bool, "comment": string}
type arrayNode = {...node, "items": array<node>}
//assignmentNode
//blockNode
//conditionalNode
type constantNode = {...node, "value": unit}
//functionAssignmentNode
type functionNode = {...node, "fn": string, "args": array<node>}
type indexNode = {...node, "dimensions": array<node>}
type objectNode = {...node, "properties": Js.Dict.t<node>}
type accessorNode = {...node, "object": node, "index": indexNode}
type operatorNode = {...functionNode, "op": string}

//parenthesisNode
type parenthesisNode = {...node, "content": node}
//rangeNode
//relationalNode
type symbolNode = {...node, "name": string}

external castAccessorNode: node => accessorNode = "%identity"
external castArrayNode: node => arrayNode = "%identity"
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
  | MjConstantNode(constantNode)
  | MjFunctionNode(functionNode)
  | MjIndexNode(indexNode)
  | MjObjectNode(objectNode)
  | MjOperatorNode(operatorNode)
  | MjParenthesisNode(parenthesisNode)
  | MjSymbolNode(symbolNode)

let castNodeType = (node: node) =>
  switch node["type"] {
  | "AccessorNode" => node->castAccessorNode->MjAccessorNode->Ok
  | "ArrayNode" => node->castArrayNode->MjArrayNode->Ok
  | "ConstantNode" => node->castConstantNode->MjConstantNode->Ok
  | "FunctionNode" => node->castFunctionNode->MjFunctionNode->Ok
  | "IndexNode" => node->castIndexNode->MjIndexNode->Ok
  | "ObjectNode" => node->castObjectNode->MjObjectNode->Ok
  | "OperatorNode" => node->castOperatorNode->MjOperatorNode->Ok
  | "ParenthesisNode" => node->castParenthesisNode->MjParenthesisNode->Ok
  | "SymbolNode" => node->castSymbolNode->MjSymbolNode->Ok
  | _ => RETodo(`Argg, unhandled MathJsNode: ${node["type"]}`)->Error
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
    `${fnode["fn"]}(${fnode["args"]->toStringNodeArray})`

  let toStringObjectEntry = ((key: string, value: node)): string => `${key}: ${value->toStringMathJsNode}`

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

  switch mathJsNode {
  | MjAccessorNode(aNode) => `${aNode["object"]->toStringMathJsNode}[${aNode["index"]->toStringIndexNode}]`
  | MjArrayNode(aNode) => `[${aNode["items"]->toStringNodeArray}]`
  | MjConstantNode(cNode) => cNode["value"]->toStringValue
  | MjFunctionNode(fNode) => fNode->toStringFunctionNode
  | MjIndexNode(iNode) => iNode->toStringIndexNode
  | MjObjectNode(oNode) => oNode->toStringObjectNode
  | MjOperatorNode(opNode) => opNode->castOperatorNodeToFunctionNode->toStringFunctionNode
  | MjParenthesisNode(pNode) => `(${toStringMathJsNode(pNode["content"])})`
  | MjSymbolNode(sNode) => sNode["name"]
  }
}
and toStringResult = (rMathJsNode: result<mathJsNode, errorValue>): string =>
  switch rMathJsNode {
  | Error(e) => errorToString(e)
  | Ok(mathJsNode) => toString(mathJsNode)
  }
and toStringMathJsNode = node => node->castNodeType->toStringResult
