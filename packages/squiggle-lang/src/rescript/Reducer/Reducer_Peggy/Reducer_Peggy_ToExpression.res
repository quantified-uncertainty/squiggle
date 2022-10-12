module ExpressionBuilder = Reducer_Expression_ExpressionBuilder
module ExpressionT = Reducer_Expression_T
module Parse = Reducer_Peggy_Parse

type expression = Reducer_T.expression
type expressionContent = Reducer_T.expressionContent

let rec fromNode = (node: Parse.node): expression => {
  let ast = Parse.nodeToAST(node)

  let content: expressionContent = {
    let caseBlock = nodeBlock =>
      ExpressionBuilder.eBlock(nodeBlock["statements"]->Js.Array2.map(fromNode))

    let caseProgram = nodeProgram =>
      ExpressionBuilder.eProgram(nodeProgram["statements"]->Js.Array2.map(fromNode))

    let caseLambda = (nodeLambda: Parse.nodeLambda): expressionContent => {
      let args =
        nodeLambda["args"]->Js.Array2.map((argNode: Parse.nodeIdentifier) => argNode["value"])
      let body = nodeLambda["body"]->fromNode

      ExpressionBuilder.eLambda(args, body, nodeLambda["name"])
    }

    let caseRecord = (nodeRecord): expressionContent => {
      nodeRecord["elements"]
      ->Js.Array2.map(keyValueNode => (
        keyValueNode["key"]->fromNode,
        keyValueNode["value"]->fromNode,
      ))
      ->ExpressionBuilder.eRecord
    }

    switch ast.content {
    | ASTBlock(nodeBlock) => caseBlock(nodeBlock)
    | ASTProgram(nodeProgram) => caseProgram(nodeProgram)
    | ASTArray(nodeArray) =>
      ExpressionBuilder.eArray(nodeArray["elements"]->Js.Array2.map(fromNode))
    | ASTRecord(nodeRecord) => caseRecord(nodeRecord)
    | ASTBoolean(nodeBoolean) => ExpressionBuilder.eBool(nodeBoolean["value"])
    | ASTCall(nodeCall) =>
      ExpressionBuilder.eCall(fromNode(nodeCall["fn"]), nodeCall["args"]->Js.Array2.map(fromNode))
    | ASTFloat(nodeFloat) => ExpressionBuilder.eNumber(nodeFloat["value"])
    | ASTIdentifier(nodeIdentifier) => ExpressionBuilder.eSymbol(nodeIdentifier["value"])
    | ASTInteger(nodeInteger) => ExpressionBuilder.eNumber(Belt.Int.toFloat(nodeInteger["value"]))
    | ASTKeyValue(nodeKeyValue) =>
      ExpressionBuilder.eArray([fromNode(nodeKeyValue["key"]), fromNode(nodeKeyValue["value"])])
    | ASTLambda(nodeLambda) => caseLambda(nodeLambda)
    | ASTLetStatement(nodeLetStatement) =>
      ExpressionBuilder.eLetStatement(
        nodeLetStatement["variable"]["value"],
        fromNode(nodeLetStatement["value"]),
      )
    | ASTModuleIdentifier(nodeModuleIdentifier) =>
      ExpressionBuilder.eIdentifier(nodeModuleIdentifier["value"])
    | ASTString(nodeString) => ExpressionBuilder.eString(nodeString["value"])
    | ASTTernary(nodeTernary) =>
      ExpressionBuilder.eTernary(
        fromNode(nodeTernary["condition"]),
        fromNode(nodeTernary["trueExpression"]),
        fromNode(nodeTernary["falseExpression"]),
      )
    // | PgNodeTypeIdentifier(nodeTypeIdentifier) =>
    //   ExpressionBuilder.eTypeIdentifier(nodeTypeIdentifier["value"])
    | ASTVoid(_) => ExpressionBuilder.eVoid
    }
  }

  {
    ast,
    content,
  }
}
