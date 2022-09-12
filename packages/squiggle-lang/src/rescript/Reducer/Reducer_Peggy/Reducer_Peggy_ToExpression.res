module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module Parse = Reducer_Peggy_Parse

type expression = Reducer_T.expression

let rec fromNode = (node: Parse.node): expression => {
  let caseBlock = nodeBlock =>
    ExpressionBuilder.eBlock(nodeBlock["statements"]->Js.Array2.map(fromNode))

  let caseProgram = nodeProgram =>
    ExpressionBuilder.eProgram(nodeProgram["statements"]->Js.Array2.map(fromNode))

  let caseLambda = (nodeLambda: Parse.nodeLambda): expression => {
    let args =
      nodeLambda["args"]->Js.Array2.map((argNode: Parse.nodeIdentifier) => argNode["value"])
    let body = nodeLambda["body"]->fromNode

    ExpressionBuilder.eLambda(args, body)
  }

  let caseRecord = (nodeRecord): expression => {
    nodeRecord["elements"]
    ->Js.Array2.map(keyValueNode => (
      keyValueNode["key"]->fromNode,
      keyValueNode["value"]->fromNode,
    ))
    ->ExpressionBuilder.eRecord
  }

  switch Parse.castNodeType(node) {
  | PgNodeBlock(nodeBlock) => caseBlock(nodeBlock)
  | PgNodeProgram(nodeProgram) => caseProgram(nodeProgram)
  | PgNodeArray(nodeArray) =>
    ExpressionBuilder.eArray(nodeArray["elements"]->Js.Array2.map(fromNode))
  | PgNodeRecord(nodeRecord) => caseRecord(nodeRecord)
  | PgNodeBoolean(nodeBoolean) => ExpressionBuilder.eBool(nodeBoolean["value"])
  | PgNodeCall(nodeCall) =>
    ExpressionBuilder.eCall(fromNode(nodeCall["fn"]), nodeCall["args"]->Js.Array2.map(fromNode))
  | PgNodeFloat(nodeFloat) => ExpressionBuilder.eNumber(nodeFloat["value"])
  | PgNodeIdentifier(nodeIdentifier) => ExpressionBuilder.eSymbol(nodeIdentifier["value"])
  | PgNodeInteger(nodeInteger) => ExpressionBuilder.eNumber(Belt.Int.toFloat(nodeInteger["value"]))
  | PgNodeKeyValue(nodeKeyValue) =>
    ExpressionBuilder.eArray([fromNode(nodeKeyValue["key"]), fromNode(nodeKeyValue["value"])])
  | PgNodeLambda(nodeLambda) => caseLambda(nodeLambda)
  | PgNodeLetStatement(nodeLetStatement) =>
    ExpressionBuilder.eLetStatement(
      nodeLetStatement["variable"]["value"],
      fromNode(nodeLetStatement["value"]),
    )
  | PgNodeModuleIdentifier(nodeModuleIdentifier) =>
    ExpressionBuilder.eIdentifier(nodeModuleIdentifier["value"])
  | PgNodeString(nodeString) => ExpressionBuilder.eString(nodeString["value"])
  | PgNodeTernary(nodeTernary) =>
    ExpressionBuilder.eTernary(
      fromNode(nodeTernary["condition"]),
      fromNode(nodeTernary["trueExpression"]),
      fromNode(nodeTernary["falseExpression"]),
    )
  // | PgNodeTypeIdentifier(nodeTypeIdentifier) =>
  //   ExpressionBuilder.eTypeIdentifier(nodeTypeIdentifier["value"])
  | PgNodeVoid(_) => ExpressionBuilder.eVoid
  }
}
