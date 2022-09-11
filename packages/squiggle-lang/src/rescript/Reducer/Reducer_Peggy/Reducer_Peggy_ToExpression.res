module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module Parse = Reducer_Peggy_Parse

type expression = ExpressionT.expression

let rec fromNode = (node: Parse.node): expression => {
  let caseBlock = nodeBlock =>
    ExpressionBuilder.eBlock(nodeBlock["statements"]->Js.Array2.map(fromNode)->Belt.List.fromArray)

  let caseLambda = (nodeLambda: Parse.nodeLambda): expression => {
    let args =
      nodeLambda["args"]
      ->Js.Array2.map((argNode: Parse.nodeIdentifier) => argNode["value"])
      ->ExpressionBuilder.eArrayString
    let body = nodeLambda["body"]->caseBlock
    ExpressionBuilder.eFunction("$$_lambda_$$", list{args, body})
  }

  // Convert function calls to macro calls
  let caseCallIdentifier = (nodeCallIdentifier: Parse.nodeCallIdentifier): expression => {
    let callIdentifier = nodeCallIdentifier["value"]
    // `callIdentifier ${callIdentifier}`->Js.log
    let callValue = switch callIdentifier {
    | "Environment.withSampleCount" => "$$_withEnvironmentSampleCount_$$"
    | callName => callName
    }
    ExpressionBuilder.eCall(callValue)
  }

  // Convert identifiers to macro calls
  let caseIdentifier = (nodeIdentifier: Parse.nodeIdentifier): expression => {
    let identifier = nodeIdentifier["value"]
    // `caseIdentifier ${identifier}`->Js.log
    switch identifier {
    | "System.environment" => "$$_environment_$$"->ExpressionBuilder.eFunction(list{})
    | symbol => symbol->ExpressionBuilder.eSymbol
    }
  }

  switch Parse.castNodeType(node) {
  | PgNodeBlock(nodeBlock) => caseBlock(nodeBlock)
  | PgNodeBoolean(nodeBoolean) => ExpressionBuilder.eBool(nodeBoolean["value"])
  | PgNodeCallIdentifier(nodeCallIdentifier) => caseCallIdentifier(nodeCallIdentifier)
  | PgNodeExpression(nodeExpression) =>
    ExpressionT.EList(nodeExpression["nodes"]->Js.Array2.map(fromNode)->Belt.List.fromArray)
  | PgNodeFloat(nodeFloat) => ExpressionBuilder.eNumber(nodeFloat["value"])
  | PgNodeIdentifier(nodeIdentifier) => caseIdentifier(nodeIdentifier)
  | PgNodeInteger(nodeInteger) => ExpressionBuilder.eNumber(Belt.Int.toFloat(nodeInteger["value"]))
  | PgNodeKeyValue(nodeKeyValue) =>
    ExpressionT.EList(list{fromNode(nodeKeyValue["key"]), fromNode(nodeKeyValue["value"])})
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
    ExpressionBuilder.eFunction(
      "$$_ternary_$$",
      list{
        fromNode(nodeTernary["condition"]),
        fromNode(nodeTernary["trueExpression"]),
        fromNode(nodeTernary["falseExpression"]),
      },
    )
  | PgNodeTypeIdentifier(nodeTypeIdentifier) =>
    ExpressionBuilder.eTypeIdentifier(nodeTypeIdentifier["value"])
  | PgNodeVoid(_) => ExpressionBuilder.eVoid
  }
}
